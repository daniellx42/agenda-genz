import type { BillingPaymentStatus } from "@agenda-genz/db";
import { status } from "elysia";
import crypto from "node:crypto";
import { Errors } from "../../shared/constants/errors";
import type { BillingModel } from "./billing.model";
import {
  BillingRepository,
  type BillingPaymentRecord,
  type BillingPaymentWithPlanDetailsRecord,
} from "./billing.repository";

const PIX_EXPIRY_MINUTES = 30;

function getWebhookSecret(): string | null {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

type BillingPaymentSyncRecord =
  | BillingPaymentRecord
  | BillingPaymentWithPlanDetailsRecord;

function mapMercadoPagoStatusToBillingStatus(
  mpStatus: string,
  pixExpiresAt: Date | null,
  now = new Date(),
): BillingPaymentStatus {
  if (mpStatus === "approved") return "APPROVED";
  if (mpStatus === "rejected") return "REJECTED";
  if (
    mpStatus === "cancelled" ||
    mpStatus === "refunded" ||
    mpStatus === "charged_back"
  ) {
    return "CANCELLED";
  }
  if (mpStatus === "expired") return "EXPIRED";
  if (pixExpiresAt && pixExpiresAt <= now) return "EXPIRED";
  return "PENDING";
}

export abstract class BillingService {
  static async listPlans(): Promise<BillingModel.listPlansResponse> {
    return BillingRepository.listActivePlans();
  }

  static async getSubscription(
    userId: string,
  ): Promise<BillingModel.subscriptionResponse> {
    const user = await BillingRepository.findUserById(userId);
    const now = new Date();
    const planExpiresAt = user?.planExpiresAt ?? null;
    const isActive = !!planExpiresAt && planExpiresAt > now;

    return {
      planExpiresAt: planExpiresAt?.toISOString() ?? null,
      trialStartedAt: null,
      isActive,
    };
  }

  static async createPixPayment(
    userId: string,
    userEmail: string,
    planId: string,
  ): Promise<BillingModel.createPaymentResponse> {
    const plan = await BillingRepository.findPlanById(planId);

    if (!plan) {
      throw status(
        Errors.BILLING.PLAN_NOT_FOUND.httpStatus,
        Errors.BILLING.PLAN_NOT_FOUND
          .message satisfies BillingModel.errorPlanNotFound,
      );
    }

    if (!plan.active) {
      throw status(
        Errors.BILLING.PLAN_INACTIVE.httpStatus,
        Errors.BILLING.PLAN_INACTIVE.message,
      );
    }

    const resumablePayment =
      await BillingRepository.findResumablePendingPayment(userId, planId);

    if (resumablePayment) {
      return {
        paymentId: resumablePayment.id,
        pixQrCode: resumablePayment.pixQrCode,
        pixQrCodeBase64: resumablePayment.pixQrCodeBase64,
        pixExpiresAt: resumablePayment.pixExpiresAt!.toISOString(),
        amount: resumablePayment.amount,
        planName: resumablePayment.plan.name,
      };
    }

    await BillingService.invalidatePendingPaymentsForNewPix(userId);

    const idempotencyKey = crypto.randomUUID();
    const pixExpiresAt = new Date(
      Date.now() + PIX_EXPIRY_MINUTES * 60 * 1000,
    );
    const [{ env }, { mpPayment }] = await Promise.all([
      import("@agenda-genz/env/server"),
      import("../../shared/lib/mercadopago"),
    ]);

    let mpResult: Awaited<ReturnType<typeof mpPayment.create>>;

    try {
      mpResult = await mpPayment.create({
        body: {
          transaction_amount: plan.priceInCents / 100,
          description: `Agenda GenZ - Plano ${plan.name}`,
          payment_method_id: "pix",
          date_of_expiration: pixExpiresAt.toISOString(),
          payer: { email: userEmail },
          notification_url: `${env.SERVER_URL}/api/billing/webhook`,
        },
        requestOptions: { idempotencyKey },
      });
    } catch {
      throw status(
        Errors.BILLING.PAYMENT_CREATION_FAILED.httpStatus,
        Errors.BILLING.PAYMENT_CREATION_FAILED
          .message satisfies BillingModel.errorPaymentCreationFailed,
      );
    }

    const pixQrCode =
      mpResult.point_of_interaction?.transaction_data?.qr_code ?? null;
    const pixQrCodeBase64 =
      mpResult.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

    const payment = await BillingRepository.createPayment({
      userId,
      planId,
      mpPaymentId: mpResult.id ? String(mpResult.id) : null,
      mpIdempotencyKey: idempotencyKey,
      amount: plan.priceInCents,
      durationDays: plan.durationDays,
      pixQrCode,
      pixQrCodeBase64,
      pixExpiresAt,
    });

    return {
      paymentId: payment.id,
      pixQrCode,
      pixQrCodeBase64,
      pixExpiresAt: pixExpiresAt.toISOString(),
      amount: plan.priceInCents,
      planName: plan.name,
    };
  }

  static async getPaymentStatus(
    paymentId: string,
    userId: string,
  ): Promise<BillingModel.paymentStatusResponse> {
    const payment = await BillingRepository.findPaymentById(paymentId, userId);

    if (!payment) {
      throw status(
        Errors.BILLING.PAYMENT_NOT_FOUND.httpStatus,
        Errors.BILLING.PAYMENT_NOT_FOUND
          .message satisfies BillingModel.errorPaymentNotFound,
      );
    }

    const reconciledPayment = await BillingService.reconcilePayment(payment);

    return BillingService.toPaymentStatusResponse(reconciledPayment);
  }

  static async processWebhook(mpPaymentId: string): Promise<void> {
    const payment = await BillingRepository.findPaymentByMpId(mpPaymentId);

    // Idempotent: skip if not found or already processed
    if (!payment || payment.status !== "PENDING") return;

    await BillingService.reconcilePayment(payment);
  }

  static calcNewExpiry(
    currentExpiry: Date | null,
    durationDays: number,
  ): Date {
    const now = new Date();
    const base =
      currentExpiry && currentExpiry > now ? currentExpiry : now;
    const result = new Date(base);
    result.setDate(result.getDate() + durationDays);
    return result;
  }

  static validateWebhookSignature(
    xSignature: string | null,
    xRequestId: string | null,
    dataId: string | null,
  ): boolean {
    if (!xSignature || !xRequestId || !dataId) return false;
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) return false;

    const parts = xSignature.split(",");
    let ts: string | undefined;
    let hash: string | undefined;

    for (const part of parts) {
      const [key, value] = part.split("=", 2);
      const trimmedKey = key?.trim();
      const trimmedValue = value?.trim();
      if (trimmedKey === "ts") ts = trimmedValue;
      else if (trimmedKey === "v1") hash = trimmedValue;
    }

    if (!ts || !hash) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expectedHash = crypto
      .createHmac("sha256", webhookSecret)
      .update(manifest)
      .digest("hex");

    return expectedHash === hash;
  }

  private static toPaymentStatusResponse(
    payment: BillingPaymentSyncRecord,
  ): BillingModel.paymentStatusResponse {
    return {
      id: payment.id,
      status: payment.status,
      planName: payment.plan.name,
      amount: payment.amount,
      paidAt: payment.paidAt?.toISOString() ?? null,
      expiresAt: payment.expiresAt?.toISOString() ?? null,
      pixExpiresAt: payment.pixExpiresAt?.toISOString() ?? null,
    };
  }

  private static async fetchMercadoPagoPaymentStatus(
    mpPaymentId: string,
  ): Promise<string> {
    const { mpPayment } = await import("../../shared/lib/mercadopago");
    try {
      const mpResult = await mpPayment.get({ id: Number(mpPaymentId) });
      return mpResult.status ?? "unmapped";
    } catch {
      throw status(
        Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED.httpStatus,
        Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED
          .message satisfies BillingModel.errorPaymentStatusSyncFailed,
      );
    }
  }

  private static async invalidatePendingPaymentsForNewPix(
    userId: string,
  ): Promise<void> {
    const pendingPayments =
      await BillingRepository.findPendingPaymentsByUserId(userId);

    if (pendingPayments.length === 0) {
      return;
    }

    const { mpPayment } = await import("../../shared/lib/mercadopago");

    for (const pendingPayment of pendingPayments) {
      if (!pendingPayment.mpPaymentId) {
        await BillingRepository.updatePaymentStatus(pendingPayment.id, {
          status: "CANCELLED",
        });
        continue;
      }

      try {
        await mpPayment.cancel({ id: Number(pendingPayment.mpPaymentId) });

        await BillingRepository.updatePaymentStatus(pendingPayment.id, {
          status: "CANCELLED",
        });
      } catch {
        let resolvedStatus: BillingPaymentStatus;

        try {
          const mpStatus = await BillingService.fetchMercadoPagoPaymentStatus(
            pendingPayment.mpPaymentId,
          );
          resolvedStatus = mapMercadoPagoStatusToBillingStatus(
            mpStatus,
            pendingPayment.pixExpiresAt,
          );
        } catch {
          throw status(
            Errors.BILLING.PAYMENT_CANCELLATION_FAILED.httpStatus,
            Errors.BILLING.PAYMENT_CANCELLATION_FAILED
              .message satisfies BillingModel.errorPaymentCancellationFailed,
          );
        }

        if (resolvedStatus === "APPROVED") {
          await BillingService.markPaymentApproved(pendingPayment);

          throw status(
            Errors.BILLING.PAYMENT_ALREADY_PROCESSED.httpStatus,
            Errors.BILLING.PAYMENT_ALREADY_PROCESSED
              .message satisfies BillingModel.errorPaymentAlreadyProcessed,
          );
        }

        if (
          resolvedStatus === "REJECTED" ||
          resolvedStatus === "CANCELLED" ||
          resolvedStatus === "EXPIRED"
        ) {
          await BillingRepository.updatePaymentStatus(pendingPayment.id, {
            status: resolvedStatus,
          });
          continue;
        }

        throw status(
          Errors.BILLING.PAYMENT_CANCELLATION_FAILED.httpStatus,
          Errors.BILLING.PAYMENT_CANCELLATION_FAILED
            .message satisfies BillingModel.errorPaymentCancellationFailed,
        );
      }
    }
  }

  private static async reconcilePayment(
    payment: BillingPaymentSyncRecord,
  ): Promise<BillingPaymentSyncRecord> {
    if (payment.status !== "PENDING") {
      return payment;
    }

    if (!payment.mpPaymentId) {
      if (payment.pixExpiresAt && payment.pixExpiresAt <= new Date()) {
        return BillingRepository.updatePaymentStatus(payment.id, {
          status: "EXPIRED",
        });
      }

      return payment;
    }

    const mpStatus = await BillingService.fetchMercadoPagoPaymentStatus(
      payment.mpPaymentId,
    );
    const resolvedStatus = mapMercadoPagoStatusToBillingStatus(
      mpStatus,
      payment.pixExpiresAt,
    );

    if (resolvedStatus === "APPROVED") {
      return BillingService.markPaymentApproved(payment);
    }

    if (resolvedStatus === "REJECTED") {
      return BillingRepository.updatePaymentStatus(payment.id, {
        status: "REJECTED",
      });
    }

    if (resolvedStatus === "CANCELLED" || resolvedStatus === "EXPIRED") {
      return BillingRepository.updatePaymentStatus(payment.id, {
        status: resolvedStatus,
      });
    }

    return payment;
  }

  private static async markPaymentApproved(
    payment: BillingPaymentSyncRecord,
  ): Promise<BillingPaymentSyncRecord> {
    const paidAt = new Date();

    // Keep payment history even if the user no longer exists.
    if (!payment.userId) {
      return BillingRepository.updatePaymentStatus(payment.id, {
        status: "APPROVED",
        paidAt,
      });
    }

    const user = await BillingRepository.findUserById(payment.userId);
    if (!user) {
      return BillingRepository.updatePaymentStatus(payment.id, {
        status: "APPROVED",
        paidAt,
      });
    }

    const newExpiresAt = BillingService.calcNewExpiry(
      user.planExpiresAt,
      payment.durationDays,
    );
    const [{ prisma }, { notifyPaymentApproved }] = await Promise.all([
      import("../../shared/lib/db"),
      import("./billing.ws"),
    ]);

    await prisma.$transaction([
      prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          paidAt,
          expiresAt: newExpiresAt,
        },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { planExpiresAt: newExpiresAt },
      }),
    ]);

    notifyPaymentApproved(payment.userId, {
      paymentId: payment.id,
      planExpiresAt: newExpiresAt.toISOString(),
    });

    return {
      ...payment,
      status: "APPROVED",
      paidAt,
      expiresAt: newExpiresAt,
    };
  }
}

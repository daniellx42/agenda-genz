import { env } from "@agenda-genz/env/server";
import { status } from "elysia";
import crypto from "node:crypto";
import { Errors } from "../../shared/constants/errors";
import { prisma } from "../../shared/lib/db";
import { mpPayment } from "../../shared/lib/mercadopago";
import type { BillingModel } from "./billing.model";
import { BillingRepository } from "./billing.repository";
import { notifyPaymentApproved } from "./billing.ws";

const PIX_EXPIRY_MINUTES = 30;

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

    // Cancel any existing PENDING payments for this user
    await BillingRepository.cancelPendingPayments(userId);

    const idempotencyKey = crypto.randomUUID();
    const pixExpiresAt = new Date(
      Date.now() + PIX_EXPIRY_MINUTES * 60 * 1000,
    );

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

  static async processWebhook(mpPaymentId: string): Promise<void> {
    const payment = await BillingRepository.findPaymentByMpId(mpPaymentId);

    // Idempotent: skip if not found or already processed
    if (!payment || payment.status !== "PENDING") return;

    // Verify payment status with MercadoPago API
    let mpStatus: string;
    try {
      const mpResult = await mpPayment.get({ id: Number(mpPaymentId) });
      mpStatus = mpResult.status ?? "unknown";
    } catch {
      return; // Can't verify, will retry on next webhook
    }

    if (mpStatus === "approved") {
      // Calculate new expiry with stacking
      const user = await BillingRepository.findUserById(payment.userId);
      const newExpiresAt = BillingService.calcNewExpiry(
        user?.planExpiresAt ?? null,
        payment.durationDays,
      );

      // Update payment + user in a transaction
      await prisma.$transaction([
        prisma.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: "APPROVED",
            paidAt: new Date(),
            expiresAt: newExpiresAt,
          },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { planExpiresAt: newExpiresAt },
        }),
      ]);

      // Notify via WebSocket
      notifyPaymentApproved(payment.userId, {
        paymentId: payment.id,
        planExpiresAt: newExpiresAt.toISOString(),
      });
    } else if (
      mpStatus === "rejected" ||
      mpStatus === "cancelled" ||
      mpStatus === "refunded" ||
      mpStatus === "charged_back"
    ) {
      const dbStatus =
        mpStatus === "rejected" ? "REJECTED" : "CANCELLED";
      await BillingRepository.updatePaymentStatus(payment.id, {
        status: dbStatus,
      });
    }
    // For "pending", "in_process", etc. — do nothing, wait for next webhook
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
      .createHmac("sha256", env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex");

    return expectedHash === hash;
  }
}

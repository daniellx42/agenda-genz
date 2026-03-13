import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace BillingModel {
  // ─── Plan Response ─────────────────────────────────────────────
  export const planResponse = t.Object({
    id: t.String(),
    interval: t.Union([
      t.Literal("MONTHLY"),
      t.Literal("QUARTERLY"),
      t.Literal("SEMIANNUAL"),
      t.Literal("ANNUAL"),
    ]),
    name: t.String(),
    priceInCents: t.Number(),
    durationDays: t.Number(),
    discountLabel: t.Union([t.String(), t.Null()]),
  });
  export type planResponse = typeof planResponse.static;

  export const listPlansResponse = t.Array(planResponse);
  export type listPlansResponse = typeof listPlansResponse.static;

  // ─── Subscription Response ─────────────────────────────────────
  export const subscriptionResponse = t.Object({
    planExpiresAt: t.Union([t.String(), t.Null()]),
    trialStartedAt: t.Union([t.String(), t.Null()]),
    isActive: t.Boolean(),
  });
  export type subscriptionResponse = typeof subscriptionResponse.static;

  // ─── Payment ───────────────────────────────────────────────────
  export const createPaymentBody = t.Object({
    planId: t.String(),
  });
  export type createPaymentBody = typeof createPaymentBody.static;

  export const createPaymentResponse = t.Object({
    paymentId: t.String(),
    pixQrCode: t.Union([t.String(), t.Null()]),
    pixQrCodeBase64: t.Union([t.String(), t.Null()]),
    pixExpiresAt: t.String(),
    amount: t.Number(),
    planName: t.String(),
  });
  export type createPaymentResponse = typeof createPaymentResponse.static;

  export const idParams = t.Object({
    id: t.String(),
  });
  export type idParams = typeof idParams.static;

  export const paymentStatusResponse = t.Object({
    id: t.String(),
    status: t.Union([
      t.Literal("PENDING"),
      t.Literal("APPROVED"),
      t.Literal("REJECTED"),
      t.Literal("CANCELLED"),
      t.Literal("EXPIRED"),
    ]),
    planName: t.String(),
    amount: t.Number(),
    paidAt: t.Union([t.String(), t.Null()]),
    expiresAt: t.Union([t.String(), t.Null()]),
    pixExpiresAt: t.Union([t.String(), t.Null()]),
  });
  export type paymentStatusResponse = typeof paymentStatusResponse.static;

  // ─── Webhook ───────────────────────────────────────────────────
  export const webhookBody = t.Object({
    action: t.String(),
    data: t.Object({
      id: t.String(),
    }),
    type: t.Optional(t.String()),
  });
  export type webhookBody = typeof webhookBody.static;

  // ─── Errors ────────────────────────────────────────────────────
  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;

  export const errorPlanNotFound = t.Literal(
    Errors.BILLING.PLAN_NOT_FOUND.message,
  );
  export type errorPlanNotFound = typeof errorPlanNotFound.static;

  export const errorPaymentNotFound = t.Literal(
    Errors.BILLING.PAYMENT_NOT_FOUND.message,
  );
  export type errorPaymentNotFound = typeof errorPaymentNotFound.static;

  export const errorPaymentCreationFailed = t.Literal(
    Errors.BILLING.PAYMENT_CREATION_FAILED.message,
  );
  export type errorPaymentCreationFailed =
    typeof errorPaymentCreationFailed.static;

  export const errorPlanExpired = t.Literal(
    Errors.BILLING.PLAN_EXPIRED.message,
  );
  export type errorPlanExpired = typeof errorPlanExpired.static;

  export const errorWebhookInvalidSignature = t.Literal(
    Errors.BILLING.WEBHOOK_INVALID_SIGNATURE.message,
  );
  export type errorWebhookInvalidSignature =
    typeof errorWebhookInvalidSignature.static;
}

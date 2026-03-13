import { Elysia, status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { authMiddleware } from "../../shared/middleware/auth";
import { BillingModel } from "./billing.model";
import { BillingService } from "./billing.service";

export const billingController = new Elysia({ prefix: "/billing" })
  .use(authMiddleware)

  // GET /plans — list active plans (auth required, no plan guard)
  .get(
    "/plans",
    async () => BillingService.listPlans(),
    {
      auth: true,
      response: {
        200: BillingModel.listPlansResponse,
        401: BillingModel.errorUnauthorized,
      },
    },
  )

  // GET /subscription — current subscription status
  .get(
    "/subscription",
    async ({ userId }) => BillingService.getSubscription(userId),
    {
      auth: true,
      response: {
        200: BillingModel.subscriptionResponse,
        401: BillingModel.errorUnauthorized,
      },
    },
  )

  // POST /checkout — create PIX payment
  .post(
    "/checkout",
    async ({ userId, user, body }) =>
      BillingService.createPixPayment(userId, (user).email, body.planId),
    {
      auth: true,
      body: BillingModel.createPaymentBody,
      response: {
        200: BillingModel.createPaymentResponse,
        401: BillingModel.errorUnauthorized,
        404: BillingModel.errorPlanNotFound,
        502: BillingModel.errorPaymentCreationFailed,
      },
    },
  )

  // GET /payments/:id — check payment status (polling fallback)
  .get(
    "/payments/:id",
    async ({ userId, params }) =>
      BillingService.getPaymentStatus(params.id, userId),
    {
      auth: true,
      params: BillingModel.idParams,
      response: {
        200: BillingModel.paymentStatusResponse,
        401: BillingModel.errorUnauthorized,
        404: BillingModel.errorPaymentNotFound,
      },
    },
  )

  // POST /webhook — MercadoPago webhook (NO auth, validates HMAC)
  .post(
    "/webhook",
    async ({ body, headers, query }) => {
      const xSignature = headers["x-signature"] as string | undefined;
      const xRequestId = headers["x-request-id"] as string | undefined;
      const dataId = (query as Record<string, string>)["data.id"];

      if (
        !BillingService.validateWebhookSignature(
          xSignature ?? null,
          xRequestId ?? null,
          dataId ?? null,
        )
      ) {
        throw status(
          Errors.BILLING.WEBHOOK_INVALID_SIGNATURE.httpStatus,
          Errors.BILLING.WEBHOOK_INVALID_SIGNATURE.message,
        );
      }

      if (
        body.action === "payment.created" ||
        body.action === "payment.updated"
      ) {
        await BillingService.processWebhook(String(body.data.id));
      }

      return { received: true };
    },
    {
      // NO auth — webhook comes from MercadoPago
      body: BillingModel.webhookBody,
    },
  );

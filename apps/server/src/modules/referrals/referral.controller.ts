import { Elysia, status, t } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { authMiddleware } from "../../shared/middleware/auth";
import { ReferralModel } from "./referral.model";
import { ReferralService } from "./referral.service";

function assertAdminRole(role: string | null | undefined) {
  if (role !== "ADMIN") {
    throw status(Errors.AUTH.FORBIDDEN.httpStatus, Errors.AUTH.FORBIDDEN.message);
  }
}

export const referralController = new Elysia({ prefix: "/referrals" })
  .use(authMiddleware)
  .get(
    "/me",
    async ({ userId }) => ReferralService.getSummary(userId),
    {
      auth: true,
      response: {
        200: ReferralModel.summaryResponse,
        401: ReferralModel.errorUnauthorized,
      },
    },
  )
  .post(
    "/code",
    async ({ userId }) => ReferralService.generateCode(userId),
    {
      auth: true,
      response: {
        200: ReferralModel.generateCodeResponse,
        401: ReferralModel.errorUnauthorized,
      },
    },
  )
  .post(
    "/apply",
    async ({ userId, body }) => ReferralService.applyCode(userId, body.code),
    {
      auth: true,
      body: ReferralModel.applyCodeBody,
      response: {
        200: ReferralModel.applyCodeResponse,
        400: ReferralModel.errorSelfReferralForbidden,
        401: ReferralModel.errorUnauthorized,
        404: ReferralModel.errorCodeNotFound,
        409: ReferralModel.errorPromptAlreadyCompleted,
      },
    },
  )
  .post(
    "/dismiss",
    async ({ userId }) => {
      await ReferralService.dismissPrompt(userId);

      return { success: true } satisfies ReferralModel.successResponse;
    },
    {
      auth: true,
      response: {
        200: ReferralModel.successResponse,
        401: ReferralModel.errorUnauthorized,
      },
    },
  )
  .post(
    "/withdrawals",
    async ({ userId, body }) =>
      ReferralService.createWithdrawal(
        userId,
        body.amountInCents,
        body.pixKey,
      ),
    {
      auth: true,
      body: ReferralModel.createWithdrawalBody,
      response: {
        200: ReferralModel.createWithdrawalResponse,
        400: t.Union([
          ReferralModel.errorWithdrawalInvalidAmount,
          ReferralModel.errorWithdrawalMinAmount,
          ReferralModel.errorWithdrawalInvalidPixKey,
        ]),
        401: ReferralModel.errorUnauthorized,
        409: ReferralModel.errorWithdrawalInsufficientBalance,
      },
    },
  )
  .get(
    "/admin/withdrawals",
    async ({ user, query }) => {
      assertAdminRole(user.role);

      return ReferralService.listAdminWithdrawals(query);
    },
    {
      auth: true,
      query: ReferralModel.adminListWithdrawalsQuery,
      response: {
        200: ReferralModel.adminListWithdrawalsResponse,
        401: ReferralModel.errorUnauthorized,
        403: ReferralModel.errorForbidden,
      },
    },
  )
  .patch(
    "/admin/withdrawals/:id/status",
    async ({ user, params, body }) => {
      assertAdminRole(user.role);

      return ReferralService.updateAdminWithdrawalStatus(
        params.id,
        body.status,
      );
    },
    {
      auth: true,
      params: ReferralModel.adminUpdateWithdrawalStatusParams,
      body: ReferralModel.adminUpdateWithdrawalStatusBody,
      response: {
        200: ReferralModel.adminWithdrawalItem,
        401: ReferralModel.errorUnauthorized,
        403: ReferralModel.errorForbidden,
        404: ReferralModel.errorWithdrawalNotFound,
      },
    },
  );

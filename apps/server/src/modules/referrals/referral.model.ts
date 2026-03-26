import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace ReferralModel {
  export const withdrawalStatus = t.Union([
    t.Literal("PENDING"),
    t.Literal("PAID"),
    t.Literal("REJECTED"),
    t.Literal("CANCELLED"),
  ]);
  export type withdrawalStatus = typeof withdrawalStatus.static;

  export const promptStatus = t.Union([
    t.Literal("PENDING"),
    t.Literal("APPLIED"),
    t.Literal("DISMISSED"),
  ]);
  export type promptStatus = typeof promptStatus.static;

  export const summaryResponse = t.Object({
    referralCode: t.Union([t.String(), t.Null()]),
    availableBalanceInCents: t.Number(),
    referralUsersCount: t.Number(),
    rewardAmountInCents: t.Number(),
    minWithdrawalAmountInCents: t.Number(),
    canWithdraw: t.Boolean(),
    promptStatus,
  });
  export type summaryResponse = typeof summaryResponse.static;

  export const generateCodeResponse = t.Object({
    code: t.String(),
  });
  export type generateCodeResponse = typeof generateCodeResponse.static;

  export const successResponse = t.Object({
    success: t.Boolean(),
  });
  export type successResponse = typeof successResponse.static;

  export const pixKeyType = t.Union([
    t.Literal("CPF"),
    t.Literal("PHONE"),
    t.Literal("EMAIL"),
    t.Literal("RANDOM"),
  ]);
  export type pixKeyType = typeof pixKeyType.static;

  export const applyCodeBody = t.Object({
    code: t.String({ minLength: 1, maxLength: 32 }),
  });
  export type applyCodeBody = typeof applyCodeBody.static;

  export const applyCodeResponse = t.Object({
    success: t.Boolean(),
    rewardAmountInCents: t.Number(),
  });
  export type applyCodeResponse = typeof applyCodeResponse.static;

  export const createWithdrawalBody = t.Object({
    amountInCents: t.Number({ minimum: 1 }),
    pixKey: t.String({ minLength: 1, maxLength: 140 }),
  });
  export type createWithdrawalBody = typeof createWithdrawalBody.static;

  export const createWithdrawalResponse = t.Object({
    id: t.String(),
    amountInCents: t.Number(),
    pixKeyType,
    status: t.Literal("PENDING"),
  });
  export type createWithdrawalResponse = typeof createWithdrawalResponse.static;

  export const adminListWithdrawalsQuery = t.Object({
    page: t.Optional(t.String({ default: "1" })),
    pageSize: t.Optional(t.String({ default: "20" })),
    status: t.Optional(withdrawalStatus),
  });
  export type adminListWithdrawalsQuery = typeof adminListWithdrawalsQuery.static;

  export const adminWithdrawalItem = t.Object({
    id: t.String(),
    amountInCents: t.Number(),
    pixKey: t.String(),
    pixKeyType,
    status: withdrawalStatus,
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
    paidAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    rejectedAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    cancelledAt: t.Union([t.String({ format: "date-time" }), t.Null()]),
    user: t.Union([
      t.Object({
        id: t.String(),
        name: t.String(),
        email: t.String(),
      }),
      t.Null(),
    ]),
  });
  export type adminWithdrawalItem = typeof adminWithdrawalItem.static;

  export const adminListWithdrawalsResponse = t.Object({
    items: t.Array(adminWithdrawalItem),
    page: t.Number(),
    pageSize: t.Number(),
    total: t.Number(),
    totalPages: t.Number(),
    status: t.Union([withdrawalStatus, t.Null()]),
  });
  export type adminListWithdrawalsResponse =
    typeof adminListWithdrawalsResponse.static;

  export const adminUpdateWithdrawalStatusParams = t.Object({
    id: t.String({ minLength: 1 }),
  });
  export type adminUpdateWithdrawalStatusParams =
    typeof adminUpdateWithdrawalStatusParams.static;

  export const adminUpdateWithdrawalStatusBody = t.Object({
    status: withdrawalStatus,
  });
  export type adminUpdateWithdrawalStatusBody =
    typeof adminUpdateWithdrawalStatusBody.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;

  export const errorForbidden = t.Literal(Errors.AUTH.FORBIDDEN.message);
  export type errorForbidden = typeof errorForbidden.static;

  export const errorCodeNotFound = t.Literal(
    Errors.REFERRAL.CODE_NOT_FOUND.message,
  );
  export type errorCodeNotFound = typeof errorCodeNotFound.static;

  export const errorSelfReferralForbidden = t.Literal(
    Errors.REFERRAL.SELF_REFERRAL_FORBIDDEN.message,
  );
  export type errorSelfReferralForbidden =
    typeof errorSelfReferralForbidden.static;

  export const errorPromptAlreadyCompleted = t.Literal(
    Errors.REFERRAL.PROMPT_ALREADY_COMPLETED.message,
  );
  export type errorPromptAlreadyCompleted =
    typeof errorPromptAlreadyCompleted.static;

  export const errorWithdrawalInvalidAmount = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_INVALID_AMOUNT.message,
  );
  export type errorWithdrawalInvalidAmount =
    typeof errorWithdrawalInvalidAmount.static;

  export const errorWithdrawalMinAmount = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_MIN_AMOUNT.message,
  );
  export type errorWithdrawalMinAmount =
    typeof errorWithdrawalMinAmount.static;

  export const errorWithdrawalInvalidPixKey = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_INVALID_PIX_KEY.message,
  );
  export type errorWithdrawalInvalidPixKey =
    typeof errorWithdrawalInvalidPixKey.static;

  export const errorWithdrawalNotFound = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_NOT_FOUND.message,
  );
  export type errorWithdrawalNotFound =
    typeof errorWithdrawalNotFound.static;

  export const errorWithdrawalInsufficientBalance = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.message,
  );
  export type errorWithdrawalInsufficientBalance =
    typeof errorWithdrawalInsufficientBalance.static;
}

import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace ReferralModel {
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

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;

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

  export const errorWithdrawalInsufficientBalance = t.Literal(
    Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.message,
  );
  export type errorWithdrawalInsufficientBalance =
    typeof errorWithdrawalInsufficientBalance.static;
}

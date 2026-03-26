import { api } from "@/lib/api";
import {
  getDataOrThrow,
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

export async function generateReferralCode(handleError?: ApiErrorHandler) {
  const result = await api.api.referrals.code.post();
  return getDataOrThrow(result, handleError);
}

export async function applyReferralCode(
  input: { code: string },
  handleError?: ApiErrorHandler,
) {
  const result = await api.api.referrals.apply.post(input);
  return getDataOrThrow(result, handleError);
}

export async function dismissReferralPrompt(handleError?: ApiErrorHandler) {
  const result = await api.api.referrals.dismiss.post();
  throwIfApiError(result.error, handleError);
}

export async function createReferralWithdrawal(
  input: { amountInCents: number; pixKey: string },
  handleError?: ApiErrorHandler,
) {
  const result = await api.api.referrals.withdrawals.post(input);
  return getDataOrThrow(result, handleError);
}

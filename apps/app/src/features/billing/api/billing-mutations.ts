import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

export async function createCheckout(
  input: { planId: string },
  handleError?: ApiErrorHandler,
) {
  const result = await api.api.billing.checkout.post(input);
  return getDataOrThrow(result, handleError);
}

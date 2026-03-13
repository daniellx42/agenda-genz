import { api } from "@/lib/api";
import {
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

export async function deleteAccount(handleError?: ApiErrorHandler) {
  const { error } = await api.api.account.delete();
  throwIfApiError(error, handleError);
}

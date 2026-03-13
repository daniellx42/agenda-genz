import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { queryOptions } from "@tanstack/react-query";

export const billingKeys = {
  all: ["billing"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  paymentStatus: (id: string) =>
    [...billingKeys.all, "payment", id] as const,
};

export function billingPlansQueryOptions(handleError?: ApiErrorHandler) {
  return queryOptions({
    queryKey: billingKeys.plans(),
    queryFn: async () => {
      const result = await api.api.billing.plans.get();
      return getDataOrThrow(result, handleError) ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function billingPaymentStatusQueryOptions(
  paymentId: string | undefined,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: billingKeys.paymentStatus(paymentId ?? ""),
    queryFn: async () => {
      if (!paymentId) return null;
      const result = await api.api.billing.payments({ id: paymentId }).get();
      return getDataOrThrow(result, handleError);
    },
    enabled: !!paymentId,
    refetchInterval: 10_000, // Poll every 10 seconds
  });
}

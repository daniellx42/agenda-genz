import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { queryOptions } from "@tanstack/react-query";

export const referralKeys = {
  all: ["referrals"] as const,
  summary: () => [...referralKeys.all, "summary"] as const,
};

export function referralSummaryQueryOptions(
  handleError?: ApiErrorHandler,
  enabled = true,
) {
  return queryOptions({
    queryKey: referralKeys.summary(),
    queryFn: async () => {
      const result = await api.api.referrals.me.get();
      return getDataOrThrow(result, handleError);
    },
    enabled,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

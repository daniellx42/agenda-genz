import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { queryOptions } from "@tanstack/react-query";

export const timeSlotKeys = {
  all: ["time-slots"] as const,
  list: () => [...timeSlotKeys.all, "list"] as const,
  available: (date: string) => [...timeSlotKeys.all, "available", date] as const,
  blockedDates: (slotId: string, monthKey: string) =>
    [...timeSlotKeys.all, "blocked-dates", slotId, monthKey] as const,
};

export function timeSlotsQueryOptions(handleError?: ApiErrorHandler) {
  return queryOptions({
    queryKey: timeSlotKeys.list(),
    queryFn: async () => {
      const result = await api.api["time-slots"].get({ query: {} });
      return getDataOrThrow(result, handleError) ?? [];
    },
  });
}

export function availableTimeSlotsQueryOptions(
  date: string,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: timeSlotKeys.available(date),
    queryFn: async () => {
      const result = await api.api["time-slots"].available.get({
        query: { date },
      });

      return getDataOrThrow(result, handleError) ?? [];
    },
  });
}

export function timeSlotBlockedDatesQueryOptions(
  slotId: string | undefined,
  monthKey: string | undefined,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: timeSlotKeys.blockedDates(slotId ?? "", monthKey ?? ""),
    queryFn: async () => {
      if (!slotId || !monthKey) return [];

      const [year, month] = monthKey.split("-").map(Number);
      if (!year || !month) return [];

      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const to = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

      const result = await api.api["time-slots"]({ id: slotId }).blocks.get({
        query: { from, to },
      });

      return getDataOrThrow(result, handleError) ?? [];
    },
    enabled: !!slotId && !!monthKey,
  });
}

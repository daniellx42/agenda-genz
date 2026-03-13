import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { AppointmentHistoryResponse } from "../types";

export const CLIENT_APPOINTMENT_HISTORY_PAGE_SIZE = 20;

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (date: string) => [...appointmentKeys.all, "list", date] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  clientHistory: (clientId: string) =>
    [...appointmentKeys.all, "client-history", clientId] as const,
  calendarDots: (year: number, month: number) =>
    [...appointmentKeys.all, "calendar-dots", year, month] as const,
  availableRange: (from: string, to: string) =>
    [...appointmentKeys.all, "available-range", from, to] as const,
};

export function appointmentListQueryOptions(
  date: string,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: appointmentKeys.list(date),
    queryFn: async () => {
      const result = await api.api.appointments.get({
        query: { date },
      });

      return getDataOrThrow(result, handleError) ?? [];
    },
  });
}

export function appointmentDetailQueryOptions(
  id: string | undefined,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: appointmentKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;

      const result = await api.api.appointments({ id }).get();
      return getDataOrThrow(result, handleError);
    },
    enabled: !!id,
  });
}

export function appointmentClientHistoryInfiniteQueryOptions(
  clientId: string | null,
  handleError?: ApiErrorHandler,
) {
  return infiniteQueryOptions({
    queryKey: appointmentKeys.clientHistory(clientId ?? ""),
    initialPageParam: 1,
    enabled: clientId !== null,
    queryFn: async ({ pageParam }): Promise<AppointmentHistoryResponse> => {
      if (!clientId) {
        throw new Error("Cliente inválido para carregar o histórico.");
      }

      const result = await api.api.appointments.client({ clientId }).get({
        query: {
          page: String(pageParam),
          limit: String(CLIENT_APPOINTMENT_HISTORY_PAGE_SIZE),
        },
      });

      const data = getDataOrThrow(result, handleError);

      if (!data) {
        throw new Error("Resposta inválida ao carregar histórico do cliente.");
      }

      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function appointmentCalendarDotsQueryOptions(
  input: { year: number; month: number },
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: appointmentKeys.calendarDots(input.year, input.month),
    refetchOnMount: "always",
    queryFn: async () => {
      const result = await api.api.appointments.calendar.get({
        query: {
          year: String(input.year),
          month: String(input.month),
        },
      });

      return getDataOrThrow(result, handleError) ?? [];
    },
  });
}

export function availableAppointmentSlotsQueryOptions(
  input: { from: string; to: string },
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: appointmentKeys.availableRange(input.from, input.to),
    queryFn: async () => {
      const result = await api.api.appointments["available-slots"].get({
        query: input,
      });

      return getDataOrThrow(result, handleError) ?? [];
    },
  });
}

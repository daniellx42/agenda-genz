import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { ServiceItem, ServiceListResponse } from "../types";

export const SERVICES_PAGE_SIZE = 20;

export const serviceKeys = {
  all: ["services"] as const,
  list: (scope: "all" | "active", search = "") =>
    [...serviceKeys.all, scope, search] as const,
  export: () => [...serviceKeys.all, "export"] as const,
};

function buildServicesInfiniteQueryOptions(
  scope: "all" | "active",
  search: string,
  activeOnly: boolean,
  handleError?: ApiErrorHandler,
) {
  return infiniteQueryOptions({
    queryKey: serviceKeys.list(scope, search),
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<ServiceListResponse> => {
      const result = await api.api.services.get({
        query: {
          page: String(pageParam),
          limit: String(SERVICES_PAGE_SIZE),
          search: search || undefined,
          activeOnly: activeOnly ? "true" : undefined,
        },
      });
      const data = getDataOrThrow(result, handleError);

      if (!data) {
        throw new Error("Resposta inválida ao listar serviços.");
      }

      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

async function fetchActiveServices(handleError?: ApiErrorHandler) {
  const result = await api.api.services.export.get();
  return getDataOrThrow(result, handleError) ?? [];
}

export function servicesInfiniteQueryOptions(
  search: string,
  handleError?: ApiErrorHandler,
) {
  return buildServicesInfiniteQueryOptions("all", search, false, handleError);
}

export function activeServicesInfiniteQueryOptions(
  search: string,
  handleError?: ApiErrorHandler,
) {
  return buildServicesInfiniteQueryOptions("active", search, true, handleError);
}

export function activeServicesQueryOptions(handleError?: ApiErrorHandler) {
  return queryOptions({
    queryKey: serviceKeys.list("active"),
    queryFn: (): Promise<ServiceItem[]> => fetchActiveServices(handleError),
  });
}

export function serviceExportQueryOptions(handleError?: ApiErrorHandler) {
  return queryOptions({
    queryKey: serviceKeys.export(),
    queryFn: (): Promise<ServiceItem[]> => fetchActiveServices(handleError),
  });
}

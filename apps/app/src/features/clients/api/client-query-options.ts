import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { ClientListResponse } from "../types";

export const CLIENTS_PAGE_SIZE = 20;

export const clientKeys = {
  all: ["clients"] as const,
  list: (search: string) => [...clientKeys.all, "list", search] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
};

export function clientsInfiniteQueryOptions(
  search: string,
  handleError?: ApiErrorHandler,
) {
  return infiniteQueryOptions({
    queryKey: clientKeys.list(search),
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<ClientListResponse> => {
      const result = await api.api.clients.get({
        query: {
          page: String(pageParam),
          limit: String(CLIENTS_PAGE_SIZE),
          search: search || undefined,
        },
      });

      const data = getDataOrThrow(result, handleError);

      if (!data) {
        throw new Error("Resposta inválida ao listar clientes.");
      }

      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function clientDetailQueryOptions(
  clientId: string | null,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: clientKeys.detail(clientId ?? ""),
    queryFn: async () => {
      if (!clientId) return null;

      const result = await api.api.clients({ id: clientId }).get();
      return getDataOrThrow(result, handleError);
    },
    enabled: !!clientId,
  });
}

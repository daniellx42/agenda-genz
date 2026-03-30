import { api } from "@/lib/api";
import {
  getDataOrThrow,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import { queryOptions } from "@tanstack/react-query";

export const IMAGE_URL_STALE_TIME = 23 * 60 * 60 * 1000;

export const uploadKeys = {
  imageUrl: (key: string | null | undefined) =>
    ["uploads", "image-url", key ?? ""] as const,
};

export function imageUrlQueryOptions(
  key: string | null | undefined,
  handleError?: ApiErrorHandler,
) {
  return queryOptions({
    queryKey: uploadKeys.imageUrl(key),
    queryFn: async () => {
      if (!key) return null;

      const result = await api.api.uploads["presigned-get"].get({
        query: { key },
      });

      if (result.error) {
        handleError?.(result.error);
        return null;
      }

      return result.data?.url ?? null;
    },
    enabled: !!key,
    staleTime: IMAGE_URL_STALE_TIME,
  });
}

export async function createPresignedUpload(
  input: {
    folder: "clients" | "profiles" | "services";
    filename: string;
    contentType: string;
  },
  handleError?: ApiErrorHandler,
) {
  const result = await api.api.uploads["presigned-put"].post(input);
  return getDataOrThrow(result, handleError);
}

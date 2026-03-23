import { imageUrlQueryOptions } from "@/lib/api/upload-query-options";
import { getRemoteImageSource } from "@/lib/media/remote-image-source";
import type { ApiErrorHandler } from "@/lib/api/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

interface UseResolvedImageParams {
  imageKey: string | null | undefined;
  previewUri?: string | null;
  enabled?: boolean;
  handleError?: ApiErrorHandler;
}

export function useResolvedImage({
  imageKey,
  previewUri = null,
  enabled = true,
  handleError,
}: UseResolvedImageParams) {
  const queryClient = useQueryClient();
  const query = imageUrlQueryOptions(imageKey, handleError);
  const queryKeyHashRef = useRef<string | null>(null);
  const initialUrlCacheHitRef = useRef(false);
  const queryKeyHash = JSON.stringify(query.queryKey);

  if (queryKeyHashRef.current !== queryKeyHash) {
    queryKeyHashRef.current = queryKeyHash;
    initialUrlCacheHitRef.current =
      queryClient.getQueryData<string | null>(query.queryKey) !== undefined;
  }

  const queryResult = useQuery({
    ...query,
    enabled: enabled && !previewUri && !!imageKey,
  });

  const imageUrl = previewUri ?? queryResult.data ?? null;
  const imageCacheKey = previewUri ? null : imageKey ?? queryResult.data ?? null;
  const imageSource = imageUrl
    ? getRemoteImageSource(imageUrl, imageCacheKey)
    : null;

  return {
    ...queryResult,
    imageUrl,
    imageCacheKey,
    imageSource,
    imageQueryKey: query.queryKey,
    initialUrlCacheHit: initialUrlCacheHitRef.current,
  };
}

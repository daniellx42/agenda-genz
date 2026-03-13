export type ApiErrorHandler = (error: unknown) => void;

interface ApiResult<TData> {
  data: TData;
  error: unknown;
}

export function throwIfApiError(
  error: unknown,
  handleError?: ApiErrorHandler,
): void {
  if (!error) return;

  handleError?.(error);
  throw error;
}

export function getDataOrThrow<TData>(
  result: ApiResult<TData>,
  handleError?: ApiErrorHandler,
): TData {
  throwIfApiError(result.error, handleError);
  return result.data;
}

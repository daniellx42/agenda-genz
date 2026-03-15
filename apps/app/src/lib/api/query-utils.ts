export interface ApiErrorValue {
  message?: string | number | boolean | null;
}

export interface ApiErrorObject {
  message?: string;
  status?: number;
  value?: string | ApiErrorValue | null;
}

export type ApiErrorLike = Error | ApiErrorObject | string | null | undefined;

export type ApiErrorHandler = <TError>(error: TError) => void;

interface ApiResult<TData> {
  data: TData;
  error: ApiErrorLike;
}

export function throwIfApiError(
  error: ApiErrorLike,
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

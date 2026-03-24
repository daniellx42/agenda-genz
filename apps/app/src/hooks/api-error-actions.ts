import type {
  ApiErrorObject,
  ApiErrorValue,
} from "@/lib/api/query-utils";

export type ApiErrorAction =
  | { type: "plan_expired" }
  | { type: "payment_already_processed" }
  | { type: "toast"; message: string };

function isApiErrorObject(error: object): error is ApiErrorObject {
  return "message" in error || "status" in error || "value" in error;
}

function hasMessageValue(
  value: string | ApiErrorValue | null | undefined,
): value is ApiErrorValue {
  return typeof value === "object" && value !== null;
}

export function getApiErrorMessage<TError>(error: TError): string {
  if (!error) return "Erro inesperado";

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && isApiErrorObject(error)) {
    if (typeof error.message === "string") return error.message;
    if (typeof error.value === "string") return error.value;
    if (hasMessageValue(error.value) && error.value.message !== undefined) {
      return String(error.value.message);
    }
  }

  if (typeof error === "string") return error;

  return "Erro inesperado";
}

export function getApiErrorAction<TError>(error: TError): ApiErrorAction {
  if (
    typeof error === "object" &&
    error !== null &&
    isApiErrorObject(error) &&
    error.status === 402
  ) {
    return { type: "plan_expired" };
  }

  const message = getApiErrorMessage(error);

  if (message === "Pagamento já processado") {
    return { type: "payment_already_processed" };
  }

  return {
    type: "toast",
    message,
  };
}

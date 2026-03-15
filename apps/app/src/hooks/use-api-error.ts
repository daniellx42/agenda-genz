import type {
  ApiErrorObject,
  ApiErrorValue,
} from "@/lib/api/query-utils";
import { useSubscriptionStore } from "@/features/billing/store/subscription-store";
import { toast } from "sonner-native";

interface ApiErrorDisplayOptions {
  duration?: number;
}

function isApiErrorObject(error: object): error is ApiErrorObject {
  return "message" in error || "status" in error || "value" in error;
}

function hasMessageValue(value: string | ApiErrorValue | null | undefined): value is ApiErrorValue {
  return typeof value === "object" && value !== null;
}

function isApiErrorDisplayOptions(value: object): value is ApiErrorDisplayOptions {
  return "duration" in value;
}

export function getApiErrorMessage<TError>(error: TError): string {
  if (!error) return "Erro inesperado";

  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Eden Treaty error format
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

export function useApiError() {
  const showError = <TError, TContext>(
    error: TError,
    optionsOrContext?: TContext,
  ) => {
    // Handle 402 Plan Expired — trigger paywall immediately
    if (
      typeof error === "object" &&
      error !== null &&
      isApiErrorObject(error) &&
      error.status === 402
    ) {
      const store = useSubscriptionStore.getState();
      // Only update if not already expired to avoid unnecessary re-renders
      if (!store.isExpired) {
        store.setPlanExpiresAt(null);
      }
      return;
    }

    const options =
      typeof optionsOrContext === "object" &&
      optionsOrContext !== null &&
      isApiErrorDisplayOptions(optionsOrContext)
        ? optionsOrContext
        : undefined;

    const message = getApiErrorMessage(error);
    toast.error(message, {
      duration: options?.duration ?? 5000,
    });
  };

  return { showError };
}

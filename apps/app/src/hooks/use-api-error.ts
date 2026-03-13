import { useSubscriptionStore } from "@/features/billing/store/subscription-store";
import { toast } from "sonner-native";

interface ApiError {
  message?: string;
  status?: number;
  value?: unknown;
}

export function getApiErrorMessage(error: unknown): string {
  if (!error) return "Erro inesperado";

  // Eden Treaty error format
  if (typeof error === "object" && error !== null) {
    const err = error as ApiError;
    if (typeof err.message === "string") return err.message;
    if (typeof err.value === "string") return err.value;
    if (
      typeof err.value === "object" &&
      err.value !== null &&
      "message" in err.value
    ) {
      return String((err.value as { message: unknown }).message);
    }
  }

  if (typeof error === "string") return error;

  return "Erro inesperado";
}

export function useApiError() {
  const showError = (
    error: unknown,
    optionsOrUnknown?: unknown,
    ..._rest: unknown[]
  ) => {
    // Handle 402 Plan Expired — trigger paywall immediately
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as ApiError).status === 402
    ) {
      useSubscriptionStore.getState().setPlanExpiresAt(null);
      return;
    }

    const options =
      typeof optionsOrUnknown === "object" &&
      optionsOrUnknown !== null &&
      "duration" in optionsOrUnknown
        ? (optionsOrUnknown as {
            duration?: number;
          })
        : undefined;
    const message = getApiErrorMessage(error);
    toast.error(message, {
      duration: options?.duration ?? 5000,
    });
  };

  return { showError };
}

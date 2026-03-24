import { authClient } from "@/lib/auth-client";
import { useSubscriptionStore } from "@/features/billing/store/subscription-store";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { getApiErrorAction } from "./api-error-actions";

function isApiErrorDisplayOptions(value: object): value is ApiErrorDisplayOptions {
  return "duration" in value;
}

interface ApiErrorDisplayOptions {
  duration?: number;
}

export function useApiError() {
  const router = useRouter();
  const { refetch: refetchSession } = authClient.useSession();

  const showError = <TError, TContext>(
    error: TError,
    optionsOrContext?: TContext,
  ) => {
    const action = getApiErrorAction(error);

    if (action.type === "plan_expired") {
      useSubscriptionStore.getState().forceExpired();
      void refetchSession();
      router.replace("/plans");
      return;
    }

    if (action.type === "payment_already_processed") {
      void refetchSession();
      router.replace("/appointments");
      return;
    }

    const options =
      typeof optionsOrContext === "object" &&
      optionsOrContext !== null &&
      isApiErrorDisplayOptions(optionsOrContext)
        ? optionsOrContext
        : undefined;

    toast.error(action.message, {
      duration: options?.duration ?? 5000,
    });
  };

  return { showError };
}

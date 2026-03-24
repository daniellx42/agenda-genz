import { getApiErrorMessage } from "@/hooks/api-error-actions";
import { authClient } from "@/lib/auth-client";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { toast } from "sonner-native";

function isAppleCancellation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  );
}

function shouldUseDevBrowserFallback(error: unknown) {
  return (
    __DEV__ &&
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ERR_REQUEST_UNKNOWN" || error.code === "ERR_REQUEST_FAILED")
  );
}

function isProviderNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PROVIDER_NOT_FOUND"
  );
}

function buildAppleUser(credential: AppleAuthentication.AppleAuthenticationCredential) {
  const firstName = credential.fullName?.givenName?.trim() || undefined;
  const lastName = credential.fullName?.familyName?.trim() || undefined;
  const email = credential.email?.trim() || undefined;

  if (!firstName && !lastName && !email) {
    return undefined;
  }

  return {
    ...(email ? { email } : {}),
    ...(firstName || lastName
      ? {
          name: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        }
      : {}),
  };
}

async function signInWithBrowserFallback() {
  const result = await authClient.signIn.social({
    provider: "apple",
    callbackURL: "/appointments",
  });

  if (result.error) {
    throw result.error;
  }

  const sessionResult = await authClient.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  return true;
}

export async function isAppleSignInAvailable() {
  if (Platform.OS !== "ios") {
    return false;
  }

  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<boolean> {
  try {
    const nativeAvailable = await isAppleSignInAvailable();

    if (!nativeAvailable) {
      return await signInWithBrowserFallback();
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      toast.error("Nao foi possivel validar sua conta Apple.");
      return false;
    }

    const appleUser = buildAppleUser(credential);
    const result = await authClient.signIn.social({
      provider: "apple",
      idToken: {
        token: credential.identityToken,
        ...(appleUser ? { user: appleUser } : {}),
      },
      callbackURL: "/appointments",
    });

    if (result.error) {
      throw result.error;
    }

    const sessionResult = await authClient.getSession();

    if (sessionResult.error) {
      throw sessionResult.error;
    }

    return true;
  } catch (error) {
    if (isAppleCancellation(error)) {
      return false;
    }

    if (shouldUseDevBrowserFallback(error)) {
      try {
        toast.error(
          "O login nativo da Apple falhou no simulador. Tentando o fallback web...",
        );
        return await signInWithBrowserFallback();
      } catch (fallbackError) {
        if (isProviderNotFoundError(fallbackError)) {
          toast.error(
            "O servidor atual ainda nao esta com o login Apple habilitado.",
          );
          return false;
        }

        toast.error(getApiErrorMessage(fallbackError));
        return false;
      }
    }

    const message = getApiErrorMessage(error);

    if (isProviderNotFoundError(error)) {
      toast.error("O servidor atual ainda nao esta com o login Apple habilitado.");
      return false;
    }

    toast.error(
      message === "Erro inesperado"
        ? "Nao foi possivel fazer login com a Apple. Tente novamente."
        : message,
    );
    return false;
  }
}

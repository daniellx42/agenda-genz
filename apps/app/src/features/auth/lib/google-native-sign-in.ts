import { authClient } from "@/lib/auth-client";
import { env } from "@agenda-genz/env/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { toast } from "sonner-native";

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

// eslint-disable-next-line @typescript-eslint/no-require-imports
let googleSigninModule: GoogleSigninModule | null = (() => {
  try {
    return require("@react-native-google-signin/google-signin") as GoogleSigninModule;
  } catch {
    return null;
  }
})();

let googleSigninConfigured = false;

function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function signInWithBrowserFallback() {
  const result = await authClient.signIn.social({
    provider: "google",
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

function shouldFallbackToBrowser() {
  if (Platform.OS === "web" || isExpoGo()) {
    return true;
  }

  return (
    Platform.OS === "ios" &&
    (!env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || !env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
  );
}

function configureGoogleSignin() {
  if (googleSigninConfigured || !googleSigninModule) return;

  googleSigninModule.GoogleSignin.configure({
    webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    ...(env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      ? { iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID }
      : {}),
  });

  googleSigninConfigured = true;
}

export async function signInWithGoogle(): Promise<boolean> {
  const useBrowserFallback = shouldFallbackToBrowser() || !googleSigninModule;

  try {
    if (useBrowserFallback) {
      return await signInWithBrowserFallback();
    }

    const googleModule = googleSigninModule;

    if (!googleModule) {
      throw new Error("Google Sign-In nativo nao esta disponivel.");
    }

    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } =
      googleModule;

    configureGoogleSignin();

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return false;
    }

    if (!response.data.idToken) {
      toast.error("Nao foi possivel validar sua conta Google.");
      return false;
    }

    const result = await authClient.signIn.social({
      provider: "google",
      idToken: {
        token: response.data.idToken,
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
    const { isErrorWithCode, statusCodes } =
      googleSigninModule ?? {
        isErrorWithCode: (_error: unknown) => false,
        statusCodes: {} as Record<string, string>,
      };

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        toast.error("Atualize os servicos do Google para continuar.");
        return false;
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        return false;
      }

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return false;
      }
    }

    toast.error("Nao foi possivel fazer login. Tente novamente.");
    return false;
  }
}

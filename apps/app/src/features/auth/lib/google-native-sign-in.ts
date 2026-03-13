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

  await authClient.getSession();
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

export async function signInWithGoogle(): Promise<void> {
  if (shouldFallbackToBrowser() || !googleSigninModule) {
    await signInWithBrowserFallback();
    return;
  }

  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } =
    googleSigninModule;

  try {
    configureGoogleSignin();

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return;
    }

    if (!response.data.idToken) {
      toast.error("Nao foi possivel validar sua conta Google.");
      return;
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

    await authClient.getSession();
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        toast.error("Atualize os servicos do Google para continuar.");
        return;
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
    }

    toast.error("Nao foi possivel fazer login. Tente novamente.");
  }
}

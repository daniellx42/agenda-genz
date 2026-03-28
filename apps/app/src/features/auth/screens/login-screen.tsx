import { AppleSignInButton } from "@/features/auth/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import {
  isAppleSignInAvailable,
  signInWithApple,
} from "@/features/auth/lib/apple-native-sign-in";
import { signInWithGoogle } from "@/features/auth/lib/google-native-sign-in";
import { authClient } from "@/lib/auth-client";
import { openPrivacyPolicy, openTermsOfService } from "@/lib/legal-links";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

type AuthProvider = "apple" | "google" | null;

export default function LoginScreen() {
  const router = useRouter();
  const { refetch: refetchSession } = authClient.useSession();
  const [activeProvider, setActiveProvider] = useState<AuthProvider>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    void isAppleSignInAvailable().then((available) => {
      if (mounted) {
        setAppleAvailable(available);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSocialSignIn = async (provider: Exclude<AuthProvider, null>) => {
    if (activeProvider) return;

    setActiveProvider(provider);
    try {
      const didSignIn = provider === "apple"
        ? await signInWithApple()
        : await signInWithGoogle();

      if (!didSignIn) {
        return;
      }

      await refetchSession();
      router.replace("/");
    } catch {
      // error handled by auth client
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: "#fff9fb" }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-end",
        paddingHorizontal: 24,
        paddingTop: 72,
        paddingBottom: 28,
      }}
    >
      <View className="items-center mb-2 px-8 w-full">
        <Image
          source={require("../../../../assets/images/icon-full-transparent.png")}
          style={{ width: 200, height: 200 }}
        />
      </View>

      <View className="self-center flex-row items-center w-64 mb-10">
        <View className="flex-1 h-px bg-rose-200" />
        <Text className="mx-3 text-rose-300 text-xs tracking-widest uppercase">
          Bem vinda(o)
        </Text>
        <View className="flex-1 h-px bg-rose-200" />
      </View>

      <View className="w-full">
        <View className="bg-white rounded-3xl p-8 border border-rose-100">
          <Text className="text-2xl font-bold text-zinc-900 mb-1">
            Acesse sua conta
          </Text>
          <Text className="text-sm text-zinc-500 mb-8 leading-relaxed">
            Gerencie seus agendamentos, acompanhe seus clientes e expanda seu negócio de beleza.
          </Text>

          <View className="gap-3">
            {appleAvailable ? (
              <AppleSignInButton
                onPress={() => {
                  void handleSocialSignIn("apple");
                }}
                disabled={activeProvider !== null}
                loading={activeProvider === "apple"}
              />
            ) : null}

            <GoogleSignInButton
              onPress={() => {
                void handleSocialSignIn("google");
              }}
              disabled={activeProvider !== null}
              loading={activeProvider === "google"}
            />
          </View>

          <Text className="mt-5 text-center text-[11px] leading-5 text-zinc-400">
            Acesso alternativo:{" "}
            <Text
              className="text-zinc-500 underline"
              accessibilityRole="link"
              onPress={() => {
                router.push("/email-login");
              }}
            >
              entrar com email e senha
            </Text>
          </Text>

          <Text className="text-xs text-center text-zinc-400 mt-6 leading-relaxed">
            Ao iniciar sessão, você concorda com os nossos termos.{" "}
            <Text
              className="text-rose-400"
              accessibilityRole="link"
              onPress={() => {
                void openTermsOfService();
              }}
            >
              Termos de Serviço
            </Text>{" "}
            e{" "}
            <Text
              className="text-rose-400"
              accessibilityRole="link"
              onPress={() => {
                void openPrivacyPolicy();
              }}
            >
              Política de Privacidade
            </Text>
          </Text>
        </View>
      </View>

      <View className="flex-row justify-center gap-2 pb-8 pt-4">
        <MaterialCommunityIcons name="content-cut" size={18} color="#f9a8d4" />
        <Feather name="star" size={18} color="#f9a8d4" />
        <MaterialCommunityIcons name="lipstick" size={18} color="#f9a8d4" />
        <MaterialCommunityIcons name="flower-outline" size={18} color="#f9a8d4" />
        <Feather name="award" size={18} color="#f9a8d4" />
      </View>
    </ScrollView>
  );
}

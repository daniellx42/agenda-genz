import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { signInWithGoogle } from "@/features/auth/lib/google-native-sign-in";
import { openPrivacyPolicy, openTermsOfService } from "@/lib/legal-links";
import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // error handled by auth client
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-end pb-12">
      {/* Logo / Hero area */}
      <View className="items-center mb-2 px-8 w-full">
        <Image
          source={require("../../../../assets/images/adaptive-icon.png")}
          style={{ width: 200, height: 200 }}
        />
      </View>

      {/* Divider */}
      <View className="flex-row items-center w-64 mb-10">
        <View className="flex-1 h-px bg-rose-200" />
        <Text className="mx-3 text-rose-300 text-xs tracking-widest uppercase">
          Bem vinda(o)
        </Text>
        <View className="flex-1 h-px bg-rose-200" />
      </View>

      {/* Card */}
      <View className="w-full px-6">
        <View className="bg-white rounded-3xl p-8 border border-rose-100">
          <Text className="text-2xl font-bold text-zinc-900 mb-1">
            Acesse sua conta
          </Text>
          <Text className="text-sm text-zinc-500 mb-8 leading-relaxed">
            Gerencie seus agendamentos, acompanhe seus clientes e expanda seu negócio de beleza.
          </Text>

          {/* Google Sign-In Button */}
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            disabled={loading}
            loading={loading}
          />

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
      {/* Bottom decorative strip */}
      <View className="flex-row justify-center gap-2 pb-8 pt-4">
        {["💅", "✨", "💄", "🌸", "💎"].map((emoji, i) => (
          <Text key={i} className="text-lg opacity-40">
            {emoji}
          </Text>
        ))}
      </View>
    </View>
  );
}

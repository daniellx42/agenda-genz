import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscriptionStore } from "../store/subscription-store";

export default function SuccessScreen() {
  const router = useRouter();
  const { setPlanExpiresAt } = useSubscriptionStore();
  const scale = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, [scale]);

  const handleContinue = useCallback(async () => {
    try {
      const result = await authClient.getSession();
      const planExpiresAt = result.data?.user?.planExpiresAt ?? null;

      if (planExpiresAt) {
        setPlanExpiresAt(planExpiresAt);
      }
    } catch {
      // The local store may already be updated by websocket or polling.
    }

    router.replace("/appointments");
  }, [router, setPlanExpiresAt]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void handleContinue();
    }, 1600);

    return () => clearTimeout(timeout);
  }, [handleContinue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={animatedStyle}
          className="w-full rounded-[32px] border border-emerald-100 bg-white p-6"
        >
          <View className="items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
              <Text className="text-5xl text-emerald-600">&#10003;</Text>
            </View>

            <Text className="mt-6 text-center text-3xl font-black text-zinc-900">
              Pagamento confirmado
            </Text>
            <Text className="mt-3 text-center text-base leading-7 text-zinc-500">
              Seu plano já foi ativado. Estamos atualizando tudo para você voltar
              direto para a agenda.
            </Text>

            <View className="mt-6 w-full rounded-[24px] bg-emerald-50 px-4 py-4">
              <Text className="text-center text-sm leading-6 text-emerald-700">
                Se o aplicativo tiver sido reiniciado ao voltar do banco, esse
                ajuste garante que o acesso continue liberado normalmente.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void handleContinue();
              }}
              className="mt-6 w-full items-center rounded-[26px] bg-rose-500 py-4 active:opacity-85"
            >
              <Text className="text-base font-bold text-white">
                Ir para a agenda agora
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

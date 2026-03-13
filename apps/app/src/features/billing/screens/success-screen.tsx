import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscriptionStore } from "../store/subscription-store";

export default function SuccessScreen() {
  const { setPlanExpiresAt } = useSubscriptionStore();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleContinue = async () => {
    // Refresh session to get updated planExpiresAt
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setPlanExpiresAt(
          session.data.user.planExpiresAt,
        );
      }
    } catch {
      // Session refresh failed, but store already has the date from WS
    }
    // The guard in _layout.tsx will auto-redirect to (app) since isExpired becomes false
  };

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      <Animated.View style={animatedStyle} className="items-center">
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
          <Text className="text-5xl text-green-600">&#10003;</Text>
        </View>
      </Animated.View>

      <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
        Pagamento confirmado!
      </Text>
      <Text className="text-base text-gray-500 text-center mb-8">
        Seu plano foi ativado com sucesso.
      </Text>

      <Pressable
        onPress={handleContinue}
        className="bg-rose-400 rounded-2xl px-8 py-4 w-full items-center"
      >
        <Text className="text-lg font-semibold text-white">Continuar</Text>
      </Pressable>
    </SafeAreaView>
  );
}

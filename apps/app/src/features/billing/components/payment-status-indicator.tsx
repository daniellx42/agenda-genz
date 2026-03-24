import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { BillingRuntimeStatus } from "../lib/billing-flow";

interface PaymentStatusIndicatorProps {
  status: BillingRuntimeStatus;
  hasCopiedCode?: boolean;
  isRefreshing?: boolean;
}

export function PaymentStatusIndicator({
  status,
  hasCopiedCode = false,
  isRefreshing = false,
}: PaymentStatusIndicatorProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "PENDING") {
      opacity.value = withRepeat(
        withTiming(0.32, {
          duration: 950,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
      return;
    }

    opacity.value = withTiming(1, { duration: 180 });
  }, [opacity, status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (status === "APPROVED") {
    return (
      <View className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <Text className="text-2xl text-emerald-600">&#10003;</Text>
        </View>
        <Text className="mt-4 text-lg font-semibold text-emerald-700">
          Pagamento confirmado
        </Text>
        <Text className="mt-2 text-sm leading-6 text-emerald-700">
          Tudo certo. Estamos liberando seu acesso e levando você para a agenda.
        </Text>
      </View>
    );
  }

  if (status === "EXPIRED") {
    return (
      <View className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <Text className="text-xl text-amber-600">&#33;</Text>
        </View>
        <Text className="mt-4 text-lg font-semibold text-amber-700">
          Esse PIX expirou
        </Text>
        <Text className="mt-2 text-sm leading-6 text-amber-700">
          Gere um novo código para continuar o pagamento sem risco de erro.
        </Text>
      </View>
    );
  }

  if (status === "CANCELLED" || status === "REJECTED") {
    return (
      <View className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
          <Text className="text-xl text-zinc-500">&#8212;</Text>
        </View>
        <Text className="mt-4 text-lg font-semibold text-zinc-900">
          Esse pagamento não foi concluído
        </Text>
        <Text className="mt-2 text-sm leading-6 text-zinc-600">
          Você pode voltar e gerar um novo PIX quando quiser continuar.
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={animatedStyle}
      className="rounded-[28px] border border-rose-100 bg-white p-5"
    >
      <View className="flex-row items-start gap-4">
        <View className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-rose-50">
          <View className="h-3.5 w-3.5 rounded-full bg-rose-500" />
        </View>

        <View className="flex-1">
          <Text className="text-lg font-semibold text-zinc-900">
            {isRefreshing
              ? "Conferindo se o pagamento já foi aprovado"
              : "Aguardando confirmação do pagamento"}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            {hasCopiedCode
              ? "Depois de pagar no banco, volte para este app. Assim que a confirmação chegar, você segue automaticamente."
              : "Copie o código PIX ou use o QR Code com outro aparelho. Quando o pagamento for confirmado, o app avança sozinho."}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

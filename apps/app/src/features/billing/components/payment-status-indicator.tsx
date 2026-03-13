import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface PaymentStatusIndicatorProps {
  status: "waiting" | "approved";
}

export function PaymentStatusIndicator({
  status,
}: PaymentStatusIndicatorProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "waiting") {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      opacity.value = 1;
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (status === "approved") {
    return (
      <View className="items-center py-4">
        <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
          <Text className="text-3xl">&#10003;</Text>
        </View>
        <Text className="text-lg font-semibold text-green-700">
          Pagamento confirmado!
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={animatedStyle} className="items-center py-4">
      <View className="w-4 h-4 rounded-full bg-amber-400 mb-3" />
      <Text className="text-base text-gray-500">
        Aguardando pagamento...
      </Text>
    </Animated.View>
  );
}

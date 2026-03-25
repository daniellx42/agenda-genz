import Feather from "@expo/vector-icons/Feather";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { ClientBirthdayDetails } from "../lib/client-birthday";

interface ClientBirthdayHighlightCardProps {
  details: ClientBirthdayDetails;
  onPress: () => void;
}

export function ClientBirthdayHighlightCard({
  details,
  onPress,
}: ClientBirthdayHighlightCardProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (details.isBirthdayMonth) {
      opacity.value = withRepeat(
        withTiming(0.4, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
      return;
    }

    opacity.value = withTiming(1, { duration: 180 });
  }, [details.isBirthdayMonth, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const toneClasses = details.isBirthdayMonth
    ? {
        container: "border-red-100 bg-red-50",
        badge: "bg-red-100",
        badgeText: "text-red-600",
        text: "text-red-700",
        secondary: "text-red-600",
        icon: "#dc2626",
      }
    : {
        container: "border-sky-100 bg-sky-50",
        badge: "bg-sky-100",
        badgeText: "text-sky-700",
        text: "text-sky-800",
        secondary: "text-sky-700",
        icon: "#0284c7",
      };

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-[28px] border p-4 active:opacity-90 ${toneClasses.container}`}
    >
      <Animated.View
        style={animatedStyle}
        className={`flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5 ${toneClasses.badge}`}
      >
        <Feather name="info" size={12} color={toneClasses.icon} />
        <Text className={`text-xs font-semibold ${toneClasses.badgeText}`}>
          {details.badgeLabel}
        </Text>
      </Animated.View>

      <Text className={`mt-3 text-sm font-semibold ${toneClasses.text}`}>
        {details.headline}
      </Text>
      <Text className={`mt-1 text-sm leading-6 ${toneClasses.secondary}`}>
        {details.supportingText}
      </Text>

      <View className="mt-3 flex-row items-center gap-2">
        <Feather name="message-circle" size={14} color={toneClasses.icon} />
        <Text className={`text-xs font-semibold ${toneClasses.badgeText}`}>
          Toque para abrir uma mensagem pronta
        </Text>
      </View>
    </Pressable>
  );
}

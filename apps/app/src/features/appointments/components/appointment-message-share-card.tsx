import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

interface AppointmentMessageShareCardProps {
  title: string;
  description: string;
  highlightLabel?: string | null;
  onPress: () => void;
}

export function AppointmentMessageShareCard({
  title,
  description,
  highlightLabel,
  onPress,
}: AppointmentMessageShareCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-2xl border border-rose-100 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {title}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-zinc-500">
            {description}
          </Text>

          {highlightLabel ? (
            <View className="mt-3 self-start rounded-full bg-rose-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-rose-500">
                {highlightLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50">
          <Feather name="chevron-right" size={18} color="#f43f5e" />
        </View>
      </View>
    </Pressable>
  );
}

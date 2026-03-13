import { Pressable, Text, View } from "react-native";
import type { AppointmentStatusConfig } from "../constants/appointment-status";
import { AppointmentStatusBadge } from "./appointment-status-badge";

interface AppointmentStatusActionButtonProps {
  title: string;
  config: AppointmentStatusConfig;
  loading?: boolean;
  onPress: () => void;
}

export function AppointmentStatusActionButton({
  title,
  config,
  loading = false,
  onPress,
}: AppointmentStatusActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-1 rounded-2xl border border-rose-100 bg-zinc-50 px-2 py-2 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
            {title}
          </Text>
        </View>
        <View>
          <AppointmentStatusBadge config={config} loading={loading} />
        </View>
      </View>
    </Pressable>
  );
}

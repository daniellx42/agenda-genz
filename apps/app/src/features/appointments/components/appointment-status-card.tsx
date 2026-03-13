import { AppointmentStatusBadge } from "./appointment-status-badge";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { AppointmentStatusConfig } from "../constants/appointment-status";

interface AppointmentStatusCardProps {
  title: string;
  description: string;
  statusConfig: AppointmentStatusConfig;
  loading?: boolean;
  onPress: () => void;
}

export function AppointmentStatusCard({
  title,
  description,
  statusConfig,
  loading = false,
  onPress,
}: AppointmentStatusCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="mb-4 rounded-2xl border border-rose-100 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {title}
          </Text>
          <Text className="mt-1 text-sm text-zinc-500">{description}</Text>
          <View className="mt-3">
            <AppointmentStatusBadge config={statusConfig} loading={loading} />
          </View>
        </View>

        <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50">
          {loading ? (
            <ActivityIndicator color="#f43f5e" size="small" />
          ) : (
            <Text className="text-lg text-rose-500">›</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

import { ActivityIndicator, Text, View } from "react-native";
import type { AppointmentStatusConfig } from "../constants/appointment-status";

interface AppointmentStatusBadgeProps {
  config: AppointmentStatusConfig;
  loading?: boolean;
}

export function AppointmentStatusBadge({
  config,
  loading = false,
}: AppointmentStatusBadgeProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${config.bg}`}>
      {loading ? (
        <ActivityIndicator color="#f43f5e" size="small" />
      ) : (
        <Text className={`text-xs font-semibold ${config.text}`}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

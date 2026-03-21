import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface TimeSlotChipProps {
  slot: { id: string; time: string; active: boolean; blockedDatesCount: number };
  busy?: boolean;
  onPress: (slot: {
    id: string;
    time: string;
    active: boolean;
    blockedDatesCount: number;
  }) => void;
}

export function TimeSlotChip({
  slot,
  busy = false,
  onPress,
}: TimeSlotChipProps) {
  const handlePress = () => {
    onPress(slot);
  };
  const isBlocked = slot.active && slot.blockedDatesCount > 0;
  const containerClassName = slot.active
    ? isBlocked
      ? "border-amber-200 bg-amber-50"
      : "border-rose-200 bg-rose-50"
    : "border-zinc-200 bg-zinc-100";
  const textClassName = slot.active
    ? isBlocked
      ? "text-amber-700"
      : "text-rose-600"
    : "text-zinc-500";
  const iconColor = slot.active
    ? isBlocked
      ? "#b45309"
      : "#f43f5e"
    : "#71717a";
  const iconName = slot.active
    ? isBlocked
      ? "calendar"
      : "more-horizontal"
    : "rotate-ccw";

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handlePress}
      disabled={busy}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${containerClassName}`}
      style={{ opacity: busy ? 0.55 : 1 }}
    >
      <Text className={`text-sm font-bold ${textClassName}`}>
        {slot.time}
      </Text>
      {busy ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Feather name={iconName} size={14} color={iconColor} />
      )}
    </Pressable>
  );
}

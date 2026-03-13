import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface TimeSlotChipProps {
  slot: { id: string; time: string; active: boolean };
  busy?: boolean;
  onPress: (slot: { id: string; time: string; active: boolean }) => void;
}

export function TimeSlotChip({
  slot,
  busy = false,
  onPress,
}: TimeSlotChipProps) {
  const handlePress = () => {
    onPress(slot);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handlePress}
      disabled={busy}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        slot.active
          ? "border-rose-200 bg-rose-50"
          : "border-zinc-200 bg-zinc-100"
      }`}
      style={{ opacity: busy ? 0.55 : 1 }}
    >
      <Text
        className={`text-sm font-bold ${
          slot.active ? "text-rose-600" : "text-zinc-500"
        }`}
      >
        {slot.time}
      </Text>
      {busy ? (
        <ActivityIndicator size="small" color={slot.active ? "#f43f5e" : "#71717a"} />
      ) : (
        <Feather
          name={slot.active ? "more-horizontal" : "rotate-ccw"}
          size={14}
          color={slot.active ? "#f43f5e" : "#71717a"}
        />
      )}
    </Pressable>
  );
}

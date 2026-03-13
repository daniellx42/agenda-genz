import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";
import { TimeSlotChip } from "./time-slot-chip";

interface TimeSlotDayRowProps {
  day: { label: string; value: number; short: string };
  slots: {
    id: string;
    time: string;
    active: boolean;
    blockedDatesCount: number;
  }[];
  onAdd: () => void;
  busySlotId?: string | null;
  onManage: (slot: {
    id: string;
    time: string;
    active: boolean;
    dayOfWeek: number;
    dayLabel?: string;
  }) => void;
}

export function TimeSlotDayRow({
  day,
  slots,
  onAdd,
  busySlotId,
  onManage,
}: TimeSlotDayRowProps) {
  const activeSlots = slots.filter((slot) => slot.active);
  const inactiveSlots = slots.length - activeSlots.length;
  const blockedDatesCount = slots.reduce(
    (total, slot) => total + slot.blockedDatesCount,
    0,
  );

  return (
    <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{
              backgroundColor: activeSlots.length > 0 ? "#f43f5e" : "#e4e4e7",
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: activeSlots.length > 0 ? "white" : "#a1a1aa" }}
            >
              {day.short}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-zinc-800">{day.label}</Text>
        </View>
        <Pressable
          onPress={onAdd}
          className="h-8 w-8 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
        >
          <Feather name="plus" size={16} color="white" />
        </Pressable>
      </View>

      {slots.length > 0 ? (
        <>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <View className="rounded-full bg-blue-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-blue-500">
                {slots.length} {slots.length === 1 ? "horário" : "horários"}
              </Text>
            </View>
            {inactiveSlots > 0 ? (
              <View className="rounded-full bg-zinc-100 px-2 py-0.5">
                <Text className="text-xs font-semibold text-zinc-500">
                  {inactiveSlots} desativado{inactiveSlots > 1 ? "s" : ""}
                </Text>
              </View>
            ) : null}
            {blockedDatesCount > 0 ? (
              <View className="rounded-full bg-amber-100 px-2 py-0.5">
                <Text className="text-xs font-semibold text-amber-700">
                  {blockedDatesCount} bloqueio{blockedDatesCount > 1 ? "s" : ""}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="my-3 mb-2 h-px bg-zinc-100" />
        </>
      ) : null}

      {slots.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {slots.map((slot) => (
            <TimeSlotChip
              key={slot.id}
              slot={slot}
              busy={busySlotId === slot.id}
              onPress={(selectedSlot) =>
                onManage({
                  ...selectedSlot,
                  dayOfWeek: day.value,
                  dayLabel: day.label,
                })
              }
            />
          ))}
        </View>
      ) : (
        <Text className="text-xs text-zinc-400">
          Nenhum horário cadastrado — toque em + para adicionar
        </Text>
      )}
    </View>
  );
}

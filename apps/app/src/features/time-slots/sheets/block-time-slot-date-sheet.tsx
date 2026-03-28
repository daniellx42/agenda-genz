import {
  availableTimeSlotsQueryOptions,
  timeSlotBlockedDatesQueryOptions,
} from "../api/time-slot-query-options";
import { CalendarMarkedDay } from "@/components/ui/calendar-marked-day";
import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { toLocalDateString } from "@/lib/formatters";
import type { DateLikeInput } from "@/lib/types/date-like";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { toast } from "sonner-native";
import {
  getNextTimeSlotDate,
  isMatchingTimeSlotDate,
} from "../lib/time-slot-blocking";

export interface BlockTimeSlotTarget {
  id: string;
  time: string;
  dayOfWeek: number;
  dayLabel?: string;
  active?: boolean;
}

interface BlockTimeSlotDateSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  slot: BlockTimeSlotTarget | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (input: {
    slotId: string;
    date: string;
    action: "block" | "unblock";
  }) => void;
}

export function BlockTimeSlotDateSheet({
  sheetRef,
  slot,
  loading = false,
  onClose,
  onConfirm,
}: BlockTimeSlotDateSheetProps) {
  const { showError } = useApiError();
  const formSheet = useFormSheet({ horizontalPadding: 20, bottomPadding: 24 });
  const today = toLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>(today);
  const slotDayLabel = slot?.dayLabel?.toLowerCase() ?? "dia correspondente";

  const normalizeDateKey = useCallback((value: DateLikeInput) => {
    if (typeof value === "string") {
      return value.slice(0, 10);
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }

    if (typeof value === "object" && value !== null && "date" in value) {
      return normalizeDateKey(value.date);
    }

    return null;
  }, []);

  const { data: selectedDateSlots } = useQuery(
    availableTimeSlotsQueryOptions(selectedDate ?? today, showError),
  );
  const { data: blockedDates = [] } = useQuery(
    timeSlotBlockedDatesQueryOptions(slot?.id, currentMonth.slice(0, 7), showError),
  );

  useEffect(() => {
    if (!slot) {
      setSelectedDate(null);
      setCurrentMonth(today);
      return;
    }

    const nextDate = getNextTimeSlotDate(slot.dayOfWeek);
    setSelectedDate(nextDate);
    setCurrentMonth(nextDate);
  }, [slot, today]);

  const normalizedBlockedDates = useMemo(
    () =>
      (Array.isArray(blockedDates) ? blockedDates : [])
        .map((date) => normalizeDateKey(date))
        .filter((date): date is string => Boolean(date && date >= today)),
    [blockedDates, normalizeDateKey, today],
  );

  const blockedDateSet = useMemo(
    () => new Set(normalizedBlockedDates),
    [normalizedBlockedDates],
  );

  const selectedSlotStatus = useMemo(() => {
    if (!slot) return null;

    return (selectedDateSlots ?? []).find((timeSlot) => timeSlot.id === slot.id) ?? null;
  }, [selectedDateSlots, slot]);

  const isSelectedBlocked = selectedDate
    ? blockedDateSet.has(selectedDate) ||
      selectedSlotStatus?.unavailableReason === "BLOCKED_DATE"
    : false;

  const markedDates = useMemo(() => {
    const marks = Object.fromEntries(
      normalizedBlockedDates.map((date) => [
        date,
        {
          marked: true,
          dotColor: "#e11d48",
          textColor: "#e11d48",
        },
      ]),
    );

    if (!selectedDate) return marks;

    return {
      ...marks,
      [selectedDate]: {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: isSelectedBlocked ? "#3f3f46" : "#f43f5e",
        textColor: "white",
        marked: isSelectedBlocked,
        dotColor: isSelectedBlocked ? "white" : undefined,
      },
    };
  }, [isSelectedBlocked, normalizedBlockedDates, selectedDate]);

  const handleDayPress = (day: DateData) => {
    if (!slot || day.dateString < today) return;

    if (!isMatchingTimeSlotDate(day.dateString, slot.dayOfWeek)) {
      toast.error(`Selecione uma data de ${slotDayLabel}.`, {
        duration: 5000,
      });
      return;
    }

    setSelectedDate(day.dateString);
  };

  const handleConfirm = () => {
    if (!slot || !selectedDate) return;
    onConfirm({
      slotId: slot.id,
      date: selectedDate,
      action: isSelectedBlocked ? "unblock" : "block",
    });
  };

  return (
    <FormSheetModal
      ref={sheetRef}
      formSheet={formSheet}
      snapPoints={["76%"]}
      enablePanDownToClose={!loading}
      onDismiss={onClose}
    >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
      >
        <View className="mb-3 rounded-2xl bg-rose-50 p-4">
          <Text className="text-sm font-bold text-zinc-900">
            Bloquear horário em uma data
          </Text>
          <Text className="mt-1 text-xs leading-5 text-zinc-500">
            O horário {slot?.time ?? "--:--"} continuará existindo nas semanas
            seguintes. Se a data já estiver bloqueada, você poderá reativá-la
            diretamente por aqui.
          </Text>
        </View>

        <Text className="mb-3 text-xs text-zinc-500">
          Selecione uma data futura de {slotDayLabel} para bloquear esse horário
          sem mexer na recorrência semanal.
        </Text>

        <Calendar
          current={currentMonth}
          minDate={today}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          dayComponent={({ date, state, marking }) => (
            <CalendarMarkedDay
              date={date}
              state={state}
              marking={marking}
              onPress={handleDayPress}
            />
          )}
          onMonthChange={(month) => {
            setCurrentMonth(
              `${month.year}-${String(month.month).padStart(2, "0")}-01`,
            );
          }}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            selectedDayBackgroundColor: "#f43f5e",
            selectedDayTextColor: "white",
            todayTextColor: "#f43f5e",
            dayTextColor: "#18181b",
            textDisabledColor: "#d4d4d8",
            arrowColor: "#f43f5e",
            monthTextColor: "#18181b",
            textMonthFontWeight: "700",
            textDayFontSize: 14,
            textMonthFontSize: 15,
          }}
        />

        <Text className="mt-4 text-xs text-zinc-500">
          {!selectedDate
            ? "Selecione a data que deve ficar indisponível."
            : isSelectedBlocked
              ? `A data ${selectedDate} já está bloqueada. Toque em reativar para desfazer o bloqueio.`
              : `Data selecionada: ${selectedDate}`}
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            disabled={!selectedDate || loading}
            className={`flex-1 items-center rounded-2xl py-3.5 active:opacity-80 ${
              isSelectedBlocked ? "bg-zinc-800" : "bg-rose-500"
            }`}
            style={{
              opacity: !selectedDate || loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                {isSelectedBlocked ? "Reativar nesta data" : "Bloquear data"}
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </FormSheetModal>
  );
}

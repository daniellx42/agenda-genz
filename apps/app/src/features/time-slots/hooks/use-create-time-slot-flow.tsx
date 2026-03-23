import type { SelectionSheetOption } from "@/components/ui/selection-sheet";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  TIME_SLOT_DAYS,
  type TimeSlotDaySelection,
} from "../constants/time-slot-days";

const SHEET_TRANSITION_DELAY_MS = 150;

export function useCreateTimeSlotFlow() {
  const addSheetRef = useRef<BottomSheetModal>(null);
  const dayPickerSheetRef = useRef<BottomSheetModal>(null);
  const [selectedDay, setSelectedDay] = useState<TimeSlotDaySelection | null>(
    null,
  );

  const openCreateForDay = useCallback((day: TimeSlotDaySelection) => {
    setSelectedDay(day);
    addSheetRef.current?.present();
  }, []);

  const openDayPicker = useCallback(() => {
    dayPickerSheetRef.current?.present();
  }, []);

  const handleSelectDay = useCallback(
    (value: string) => {
      const dayOfWeek = Number(value);
      const selectedTimeSlotDay = TIME_SLOT_DAYS.find(
        (day) => day.value === dayOfWeek,
      );

      if (!selectedTimeSlotDay) {
        return;
      }

      dayPickerSheetRef.current?.dismiss();

      setTimeout(() => {
        openCreateForDay({
          dayOfWeek: selectedTimeSlotDay.value,
          label: selectedTimeSlotDay.label,
        });
      }, SHEET_TRANSITION_DELAY_MS);
    },
    [openCreateForDay],
  );

  const handleCloseAddSheet = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const dayOptions = useMemo<SelectionSheetOption[]>(
    () =>
      TIME_SLOT_DAYS.map((day) => ({
        value: String(day.value),
        title: day.label,
        description: `Adicionar horario para ${day.label.toLowerCase()}.`,
        icon: <Feather name="calendar" size={18} color="#f43f5e" />,
      })),
    [],
  );

  return {
    addSheetRef,
    dayPickerSheetRef,
    selectedDay,
    dayOptions,
    openCreateForDay,
    openDayPicker,
    handleSelectDay,
    handleCloseAddSheet,
  };
}

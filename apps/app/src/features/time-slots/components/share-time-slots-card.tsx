import { availableAppointmentSlotsQueryOptions } from "@/features/appointments/api/appointment-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { toLocalDateString } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { toast } from "sonner-native";
import {
  buildShareMarkedDates,
  clampShareEndDate,
  compareMonth,
  formatSelectedRange,
  getShareTimeSlotsMessage,
} from "../lib/share-time-slots";

export function ShareTimeSlotsCard() {
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const today = toLocalDateString();
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const currentBaseMonth = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  }, []);

  const markedDates = useMemo(
    () => buildShareMarkedDates(selectedStart, selectedEnd),
    [selectedEnd, selectedStart],
  );

  const finalDate = selectedEnd ?? selectedStart;
  const canShare = Boolean(selectedStart && finalDate);

  const handleDayPress = (day: DateData) => {
    if (day.dateString < today) {
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(day.dateString);
      setSelectedEnd(null);
      return;
    }

    if (day.dateString < selectedStart) {
      setSelectedStart(day.dateString);
      setSelectedEnd(null);
      return;
    }

    const { end, didClamp } = clampShareEndDate(selectedStart, day.dateString);

    if (didClamp) {
      toast.error("Selecione no máximo 7 dias para compartilhar.", {
        duration: 5000,
      });
    }

    setSelectedEnd(end);
  };

  const handleShare = async () => {
    if (!selectedStart) return;

    const to = selectedEnd ?? selectedStart;
    setSharing(true);

    try {
      const data = await queryClient.fetchQuery(
        availableAppointmentSlotsQueryOptions(
          { from: selectedStart, to },
          showError,
        ),
      );

      const message = getShareTimeSlotsMessage(data);

      if (!message) {
        toast.error("Nos dias selecionados não foi encontrado nenhum horário.", {
          duration: 5000,
        });
        return;
      }

      await Share.share({
        message: `Horários disponíveis\n\n${message}`,
      });
    } catch (error) {
      showError(error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="mb-4 rounded-[28px] border border-rose-100 bg-white p-4">
      <View className="mb-3 rounded-2xl bg-rose-50 p-4">
        <Text className="text-sm font-bold text-zinc-900">
          Compartilhe seus horários disponíveis
        </Text>
        <Text className="mt-1 text-xs leading-5 text-zinc-500">
          Selecione de 1 até 7 dias para enviar os horários disponíveis pelo
          WhatsApp ou outro mensageiro.
        </Text>
      </View>

      <Calendar
        current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-01`}
        minDate={today}
        markingType="period"
        markedDates={markedDates}
        disableArrowLeft={compareMonth(currentMonth, currentBaseMonth) <= 0}
        enableSwipeMonths
        onDayPress={handleDayPress}
        onMonthChange={(month: DateData) =>
          setCurrentMonth({ year: month.year, month: month.month })
        }
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          selectedDayBackgroundColor: "#f43f5e",
          selectedDayTextColor: "white",
          todayTextColor: "#f43f5e",
          dayTextColor: "#18181b",
          textDisabledColor: "#d4d4d8",
          dotColor: "#f43f5e",
          arrowColor: "#f43f5e",
          monthTextColor: "#18181b",
          textMonthFontWeight: "700",
          textDayFontSize: 14,
          textMonthFontSize: 15,
        }}
      />

      <Text className="mt-3 text-xs text-zinc-500">
        {formatSelectedRange(selectedStart, selectedEnd)}
      </Text>

      <Pressable
        onPress={handleShare}
        disabled={!canShare || sharing}
        className="mt-4 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
        style={{ opacity: !canShare || sharing ? 0.6 : 1 }}
      >
        {sharing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-sm font-bold text-white">
            Compartilhar horários
          </Text>
        )}
      </Pressable>
    </View>
  );
}

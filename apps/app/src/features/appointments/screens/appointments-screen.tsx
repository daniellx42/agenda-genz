import { CalendarMarkedDay } from "@/components/ui/calendar-marked-day";
import { NewAppointmentSheet } from "@/features/appointments/components/new-appointment-sheet";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useRegisterTabContextualAction } from "@/features/navigation/lib/tab-contextual-action-context";
import { useApiError } from "@/hooks/use-api-error";
import { ensureCalendarPtBrLocale } from "@/lib/calendar-locale";
import { toLocalDateString } from "@/lib/formatters";
import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View, useWindowDimensions } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appointmentCalendarDotsQueryOptions,
  appointmentListQueryOptions,
} from "../api/appointment-query-options";
import { AppointmentCard } from "../components/appointment-card";
import { AppointmentCardSkeleton } from "../components/appointment-card-skeleton";
import {
  buildMarkedDates,
  formatSelectedDay,
  getCalendarHeight,
} from "../lib/appointment-calendar";

const COLLAPSE_SCROLL = 180;

ensureCalendarPtBrLocale();

interface CalendarMonthState {
  year: number;
  month: number;
}

interface CalendarListHandle {
  scrollToMonth: (date: string) => void;
}

function toMonthDateString({ year, month }: CalendarMonthState) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function shiftMonth(
  { year, month }: CalendarMonthState,
  delta: number,
): CalendarMonthState {
  const shiftedDate = new Date(Date.UTC(year, month - 1 + delta, 1));

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth() + 1,
  };
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { showError } = useApiError();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { setDate, reset } = useAppointmentDraft();
  const queryClient = useQueryClient();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const calendarRef = useRef<CalendarListHandle | null>(null);

  const today = toLocalDateString();
  const initialMonth = useRef<CalendarMonthState>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }).current;
  const initialCalendarDate = useRef(toMonthDateString(initialMonth)).current;
  const visibleMonthRef = useRef<CalendarMonthState>(initialMonth);
  const selectedDateRef = useRef(today);
  const previousImageKeysRef = useRef<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [committedMonth, setCommittedMonth] = useState(initialMonth);
  const calendarHeight = getCalendarHeight(committedMonth);

  const scrollY = useRef(new Animated.Value(0)).current;
  const calendarTranslateY = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL],
    outputRange: [0, -calendarHeight],
    extrapolate: "clamp",
  });
  const calendarOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const {
    data: calendarDots,
    refetch: refetchCalendarDots,
  } = useQuery({
    ...appointmentCalendarDotsQueryOptions(committedMonth, showError),
    placeholderData: (previousData) => previousData,
  });

  const { data: appointments, isLoading, refetch: refetchAppointments } = useQuery(
    appointmentListQueryOptions(selectedDate, showError),
  );

  useFocusEffect(
    useRef(() => {
      refetchCalendarDots();
      refetchAppointments();
    }).current,
  );

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    if (!appointments) {
      return;
    }

    previousImageKeysRef.current = appointments
      .map((appointment) => appointment.service.imageKey)
      .filter((imageKey): imageKey is string => Boolean(imageKey));
  }, [appointments, selectedDate]);

  const syncCommittedMonth = (month: CalendarMonthState) => {
    setCommittedMonth((previousMonth) =>
      previousMonth.year === month.year && previousMonth.month === month.month
        ? previousMonth
        : month,
    );
  };

  useEffect(() => {
    const previousMonth = shiftMonth(committedMonth, -1);
    const nextMonth = shiftMonth(committedMonth, 1);

    void queryClient
      .prefetchQuery(appointmentCalendarDotsQueryOptions(previousMonth))
      .catch(() => undefined);
    void queryClient
      .prefetchQuery(appointmentCalendarDotsQueryOptions(nextMonth))
      .catch(() => undefined);
  }, [committedMonth, queryClient]);

  const handleDayPress = (day: DateData) => {
    const pressedMonth = { year: day.year, month: day.month };
    const shouldNavigateToPressedMonth =
      pressedMonth.year !== visibleMonthRef.current.year
      || pressedMonth.month !== visibleMonthRef.current.month;

    selectedDateRef.current = day.dateString;
    setSelectedDate(day.dateString);
    visibleMonthRef.current = pressedMonth;
    syncCommittedMonth(pressedMonth);
    setDate(day.dateString);

    if (shouldNavigateToPressedMonth) {
      calendarRef.current?.scrollToMonth(day.dateString);
    }
  };

  const openCreateSheet = useCallback(() => {
    setDate(selectedDateRef.current);
    sheetRef.current?.present();
  }, [setDate]);

  const closeCreateSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const handleDismissCreateSheet = useCallback(() => {
    reset();
  }, [reset]);

  useRegisterTabContextualAction({
    routeName: "appointments",
    label: "Novo agendamento",
    accessibilityLabel: "Novo agendamento",
    onPress: openCreateSheet,
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "Professional";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const markedDates = buildMarkedDates(calendarDots ?? [], selectedDate);
  const scrollContentMinHeight = windowHeight + calendarHeight + 80;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="px-5 pb-2 pt-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-medium uppercase tracking-widest text-rose-400">
              {greeting}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-bold text-zinc-900">
                {firstName}
              </Text>
              <Feather name="star" size={16} color="#f43f5e" />
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações"
            className="h-11 w-11 items-center justify-center rounded-full border border-rose-100 bg-white active:opacity-80"
          >
            <Feather name="settings" size={24} color="#f43f5e" />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: calendarHeight,
            zIndex: 1,
            overflow: "hidden",
            opacity: calendarOpacity,
            transform: [{ translateY: calendarTranslateY }],
          }}
        >
          <CalendarList
            ref={calendarRef}
            current={initialCalendarDate}
            horizontal
            pagingEnabled
            calendarHeight={calendarHeight}
            calendarWidth={windowWidth}
            hideExtraDays={false}
            onDayPress={handleDayPress}
            onMonthChange={(month: DateData) => {
              const nextMonth = { year: month.year, month: month.month };

              visibleMonthRef.current = nextMonth;
              syncCommittedMonth(nextMonth);
            }}
            markedDates={markedDates}
            dayComponent={({ date, state, marking }) => (
              <CalendarMarkedDay
                date={date}
                state={state}
                marking={marking}
                onPress={handleDayPress}
                allowDisabledPress
              />
            )}
            theme={{
              backgroundColor: "#fff9fb",
              calendarBackground: "#fff9fb",
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
        </Animated.View>

        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          contentContainerStyle={{
            paddingTop: calendarHeight,
            paddingBottom: calendarHeight + 120,
            minHeight: scrollContentMinHeight,
          }}
          stickyHeaderIndices={[0]}
        >
          <View className="border-b border-rose-100 bg-white px-5 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold capitalize text-zinc-900">
                {formatSelectedDay(selectedDate)}
              </Text>
              <View className="rounded-full bg-rose-500 px-3 py-1">
                <Text className="text-xs font-bold text-white">
                  {(appointments ?? []).length} agendamento
                  {(appointments ?? []).length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>
          <View className="px-5 pt-4">
            {isLoading && (
              <View>
                {Array.from({ length: 4 }).map((_, index) => (
                  <AppointmentCardSkeleton key={index} />
                ))}
              </View>
            )}

            {!isLoading && (appointments ?? []).length === 0 && (
              <View className="items-center py-12">
                <Feather
                  name="inbox"
                  size={28}
                  color="#a1a1aa"
                  style={{ marginBottom: 12 }}
                />
                <Text className="text-sm text-zinc-500">
                  Nenhum agendamento para este dia
                </Text>
              </View>
            )}

            {(appointments ?? []).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </View>
        </Animated.ScrollView>
      </View>

      <NewAppointmentSheet
        ref={sheetRef}
        onDismiss={handleDismissCreateSheet}
        onRequestClose={closeCreateSheet}
      />
    </SafeAreaView>
  );
}

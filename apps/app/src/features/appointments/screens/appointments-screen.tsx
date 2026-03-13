import { CalendarMarkedDay } from "@/components/ui/calendar-marked-day";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useApiError } from "@/hooks/use-api-error";
import { toLocalDateString } from "@/lib/formatters";
import Feather from '@expo/vector-icons/Feather';
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
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
} from "../lib/appointment-calendar";

const CALENDAR_HEIGHT = 340;
const COLLAPSE_SCROLL = 180;

export default function AppointmentsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { showError } = useApiError();
  const { setDate } = useAppointmentDraft();
  const { height: windowHeight } = useWindowDimensions();

  const today = toLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const currentMonthDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-01`;

  const scrollY = useRef(new Animated.Value(0)).current;
  const calendarTranslateY = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL],
    outputRange: [0, -CALENDAR_HEIGHT],
    extrapolate: "clamp",
  });
  const calendarOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const { data: calendarDots, refetch: refetchCalendarDots } = useQuery(
    appointmentCalendarDotsQueryOptions(currentMonth, showError),
  );

  const { data: appointments, isLoading, refetch: refetchAppointments } = useQuery(
    appointmentListQueryOptions(selectedDate, showError),
  );

  useFocusEffect(
    useRef(() => {
      refetchCalendarDots();
      refetchAppointments();
    }).current,
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setCurrentMonth({ year: day.year, month: day.month });
    setDate(day.dateString);
  };

  const firstName = session?.user?.name?.split(" ")[0] ?? "Professional";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const markedDates = buildMarkedDates(calendarDots ?? [], selectedDate);
  const scrollContentMinHeight = windowHeight + CALENDAR_HEIGHT + 80;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="px-5 pb-2 pt-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-medium uppercase tracking-widest text-rose-400">
              {greeting}
            </Text>
            <Text className="text-xl font-bold text-zinc-900">
              {firstName} ✨
            </Text>
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
            zIndex: 1,
            opacity: calendarOpacity,
            transform: [{ translateY: calendarTranslateY }],
          }}
        >
          <Calendar
            current={currentMonthDate}
            onDayPress={handleDayPress}
            onMonthChange={(month: DateData) =>
              setCurrentMonth({ year: month.year, month: month.month })
            }
            markedDates={markedDates}
            dayComponent={({ date, state, marking }) => (
              <CalendarMarkedDay
                date={date}
                state={state}
                marking={marking}
                onPress={handleDayPress}
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
            paddingTop: CALENDAR_HEIGHT,
            paddingBottom: CALENDAR_HEIGHT + 120,
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
                <Text className="mb-3 text-3xl">📭</Text>
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
    </SafeAreaView>
  );
}

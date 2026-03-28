import { CalendarMarkedDay } from "@/components/ui/calendar-marked-day";
import { NewAppointmentSheet } from "@/features/appointments/components/new-appointment-sheet";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useRegisterTabContextualAction } from "@/features/navigation/lib/tab-contextual-action-context";
import { useCurvedTabBarHeight } from "@/features/navigation/lib/use-curved-tab-bar-height";
import {
  applyReferralCode,
  dismissReferralPrompt,
  generateReferralCode,
} from "@/features/referrals/api/referral-mutations";
import {
  referralKeys,
  referralSummaryQueryOptions,
} from "@/features/referrals/api/referral-query-options";
import { ReferralReminderModal } from "@/features/referrals/components/referral-reminder-modal";
import {
  buildDeferredReferralReminderSnapshot,
  getHasSeenReferralPrompt,
  getReferralReminderSnapshot,
  markReferralPromptSeen,
  saveReferralReminderSnapshot,
  shouldShowReferralReminder,
  type ReferralReminderSnapshot,
} from "@/features/referrals/lib/referral-storage";
import { normalizeReferralCode } from "@/features/referrals/lib/referral-form";
import { ApplyReferralCodeSheet } from "@/features/referrals/sheets/apply-referral-code-sheet";
import { getApiErrorMessage } from "@/hooks/api-error-actions";
import { useApiError } from "@/hooks/use-api-error";
import { ensureCalendarPtBrLocale } from "@/lib/calendar-locale";
import { toLocalDateString } from "@/lib/formatters";
import * as Clipboard from "expo-clipboard";
import Feather from '@expo/vector-icons/Feather';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View, useWindowDimensions } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
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
  const referralPromptSheetRef = useRef<BottomSheetModal>(null);
  const { setDate, reset } = useAppointmentDraft();
  const queryClient = useQueryClient();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const calendarRef = useRef<CalendarListHandle | null>(null);
  const hasPresentedReferralPromptRef = useRef(false);

  const today = toLocalDateString();
  const initialMonth = useRef<CalendarMonthState>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }).current;
  const initialCalendarDate = useRef(toMonthDateString(initialMonth)).current;
  const visibleMonthRef = useRef<CalendarMonthState>(initialMonth);
  const selectedDateRef = useRef(today);
  const previousImageKeysRef = useRef<string[]>([]);
  const reminderCopyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [committedMonth, setCommittedMonth] = useState(initialMonth);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralCodeError, setReferralCodeError] = useState("");
  const [hasSeenReferralPrompt, setHasSeenReferralPrompt] = useState(false);
  const [isReferralPromptReady, setIsReferralPromptReady] = useState(false);
  const [referralReminderVisible, setReferralReminderVisible] = useState(false);
  const [hasCopiedReminderCode, setHasCopiedReminderCode] = useState(false);
  const [referralReminderSnapshot, setReferralReminderSnapshot] =
    useState<ReferralReminderSnapshot | null>(null);
  const [isReferralReminderReady, setIsReferralReminderReady] = useState(false);
  const [generatedReferralReminderCode, setGeneratedReferralReminderCode] =
    useState<string | null>(null);
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
  const { data: referralSummary, refetch: refetchReferralSummary } = useQuery(
    referralSummaryQueryOptions(showError, Boolean(session?.user.id)),
  );

  const applyReferralCodeMutation = useMutation({
    mutationFn: (code: string) => applyReferralCode({ code }),
    onSuccess: async (result) => {
      if (!result) {
        return;
      }

      toast.success(`Codigo aplicado! Voce ganhou R$ ${result.rewardAmountInCents / 100},00.`);
      setReferralCodeInput("");
      setReferralCodeError("");
      referralPromptSheetRef.current?.dismiss();
      await queryClient.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: (error) => {
      setReferralCodeError(getApiErrorMessage(error));
      showError(error);
    },
  });

  const dismissReferralPromptMutation = useMutation({
    mutationFn: async () => dismissReferralPrompt(),
    onSuccess: async () => {
      setReferralCodeInput("");
      setReferralCodeError("");
      referralPromptSheetRef.current?.dismiss();
      await queryClient.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: showError,
  });

  const generateReferralCodeMutation = useMutation({
    mutationFn: async () => generateReferralCode(),
    onSuccess: async (result) => {
      if (!result) {
        return;
      }

      setGeneratedReferralReminderCode(result.code);
      setHasCopiedReminderCode(false);
      toast.success("Codigo de convite gerado!");
      await queryClient.invalidateQueries({ queryKey: referralKeys.all });
    },
    onError: showError,
  });

  useEffect(() => {
    return () => {
      if (reminderCopyResetTimerRef.current) {
        clearTimeout(reminderCopyResetTimerRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useRef(() => {
      refetchCalendarDots();
      refetchAppointments();
      refetchReferralSummary();
    }).current,
  );

  useEffect(() => {
    let isMounted = true;

    hasPresentedReferralPromptRef.current = false;
    setReferralCodeInput("");
    setReferralCodeError("");
    setHasSeenReferralPrompt(false);
    setIsReferralPromptReady(false);
    setGeneratedReferralReminderCode(null);
    setHasCopiedReminderCode(false);
    setReferralReminderVisible(false);

    if (!session?.user.id) {
      setReferralReminderSnapshot(null);
      setIsReferralReminderReady(false);
      return;
    }

    setIsReferralReminderReady(false);
    void Promise.all([
      getReferralReminderSnapshot(session.user.id),
      getHasSeenReferralPrompt(session.user.id),
    ]).then(([snapshot, hasSeenPrompt]) => {
      if (!isMounted) {
        return;
      }

      setReferralReminderSnapshot(snapshot);
      setHasSeenReferralPrompt(hasSeenPrompt);
      setIsReferralPromptReady(true);
      setIsReferralReminderReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

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

  useEffect(() => {
    if (!referralSummary || !isReferralPromptReady) {
      return;
    }

    if (referralSummary.promptStatus === "PENDING") {
      if (hasPresentedReferralPromptRef.current || hasSeenReferralPrompt) {
        return;
      }

      hasPresentedReferralPromptRef.current = true;
      setHasSeenReferralPrompt(true);
      void markReferralPromptSeen(session?.user.id);
      requestAnimationFrame(() => {
        referralPromptSheetRef.current?.present();
      });
      return;
    }

    referralPromptSheetRef.current?.dismiss();
  }, [hasSeenReferralPrompt, isReferralPromptReady, referralSummary, session?.user.id]);

  useEffect(() => {
    if (
      !referralSummary ||
      referralSummary.promptStatus === "PENDING" ||
      !referralReminderSnapshot ||
      !isReferralReminderReady ||
      referralReminderVisible
    ) {
      return;
    }

    if (!shouldShowReferralReminder(referralReminderSnapshot)) {
      return;
    }

    setReferralReminderVisible(true);
  }, [
    isReferralReminderReady,
    referralReminderSnapshot,
    referralReminderVisible,
    referralSummary,
  ]);

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

  const scheduleNextReferralReminder = useCallback(async () => {
    if (!session?.user.id) {
      return;
    }

    const nextSnapshot = buildDeferredReferralReminderSnapshot(21);
    setReferralReminderSnapshot(nextSnapshot);
    await saveReferralReminderSnapshot(session.user.id, nextSnapshot);
  }, [session?.user.id]);

  const handleReferralPromptClose = useCallback(() => {
    if (dismissReferralPromptMutation.isPending) {
      return;
    }

    dismissReferralPromptMutation.mutate();
  }, [dismissReferralPromptMutation]);

  const handleReferralPromptSubmit = useCallback(() => {
    const normalizedCode = normalizeReferralCode(referralCodeInput);

    if (!normalizedCode) {
      setReferralCodeError("Digite um codigo para continuar.");
      return;
    }

    setReferralCodeError("");
    applyReferralCodeMutation.mutate(normalizedCode);
  }, [applyReferralCodeMutation, referralCodeInput]);

  const handleReminderClose = useCallback(() => {
    setReferralReminderVisible(false);
    setGeneratedReferralReminderCode(null);
    setHasCopiedReminderCode(false);
    void scheduleNextReferralReminder();
  }, [scheduleNextReferralReminder]);

  const handleReminderCopyCode = useCallback(async () => {
    const currentCode =
      generatedReferralReminderCode ?? referralSummary?.referralCode ?? null;

    if (!currentCode) {
      return;
    }

    await Clipboard.setStringAsync(currentCode);
    setHasCopiedReminderCode(true);

    if (reminderCopyResetTimerRef.current) {
      clearTimeout(reminderCopyResetTimerRef.current);
    }

    reminderCopyResetTimerRef.current = setTimeout(() => {
      setHasCopiedReminderCode(false);
    }, 1600);
    toast.success("Codigo de convite copiado!");
  }, [generatedReferralReminderCode, referralSummary?.referralCode]);

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
  const tabBarHeight = useCurvedTabBarHeight();
  const scrollContentMinHeight = windowHeight + calendarHeight + 80;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fff9fb" }}
    >
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
            paddingBottom: calendarHeight + tabBarHeight,
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

      <ApplyReferralCodeSheet
        sheetRef={referralPromptSheetRef}
        value={referralCodeInput}
        error={referralCodeError}
        loading={
          applyReferralCodeMutation.isPending ||
          dismissReferralPromptMutation.isPending
        }
        onChangeText={(value) => {
          setReferralCodeInput(normalizeReferralCode(value));
          setReferralCodeError("");
        }}
        onSubmit={handleReferralPromptSubmit}
        onClose={handleReferralPromptClose}
      />

      <ReferralReminderModal
        visible={referralReminderVisible}
        referralCode={
          generatedReferralReminderCode ?? referralSummary?.referralCode ?? null
        }
        hasCopiedCode={hasCopiedReminderCode}
        generatingCode={generateReferralCodeMutation.isPending}
        onGenerateCode={() => {
          generateReferralCodeMutation.mutate();
        }}
        onCopyCode={() => {
          void handleReminderCopyCode();
        }}
        onClose={handleReminderClose}
      />
    </SafeAreaView>
  );
}

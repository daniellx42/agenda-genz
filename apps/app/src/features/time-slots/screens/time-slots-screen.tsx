import {
  activateTimeSlot,
  blockTimeSlotDate,
  deactivateTimeSlot,
  deleteTimeSlot,
  unblockTimeSlotDate,
} from "../api/time-slot-mutations";
import {
  timeSlotKeys,
  timeSlotsQueryOptions,
} from "../api/time-slot-query-options";
import { TIME_SLOT_DAYS } from "../constants/time-slot-days";
import { ShareTimeSlotsCard } from "../components/share-time-slots-card";
import { TimeSlotDayRowSkeleton } from "../components/time-slot-day-row-skeleton";
import { TimeSlotDayRow } from "../components/time-slot-day-row";
import { BlockTimeSlotDateSheet } from "../sheets/block-time-slot-date-sheet";
import { AddTimeSheet } from "../sheets/add-time-sheet";
import { ConfirmActionSheet } from "@/components/ui/confirm-action-sheet";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { appointmentKeys } from "@/features/appointments/api/appointment-query-options";
import { useApiError } from "@/hooks/use-api-error";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import type { TimeSlotDaySelection } from "../constants/time-slot-days";
import type { BlockTimeSlotTarget } from "../sheets/block-time-slot-date-sheet";

export default function TimeSlotsScreen() {
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const addSheetRef = useRef<BottomSheetModal>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);
  const blockDateSheetRef = useRef<BottomSheetModal>(null);
  const confirmDeleteSheetRef = useRef<BottomSheetModal>(null);
  const [addSheetDay, setAddSheetDay] = useState<TimeSlotDaySelection | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<BlockTimeSlotTarget | null>(
    null,
  );
  const [slotToBlock, setSlotToBlock] = useState<BlockTimeSlotTarget | null>(
    null,
  );
  const [pendingDeleteSlot, setPendingDeleteSlot] =
    useState<BlockTimeSlotTarget | null>(null);

  const { data: slots, isLoading } = useQuery(
    timeSlotsQueryOptions(showError),
  );

  const invalidateTimeSlotAvailability = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
    await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTimeSlot(id),
    onSuccess: async () => {
      toast.success("Horário removido!");
      await invalidateTimeSlotAvailability();
      confirmDeleteSheetRef.current?.dismiss();
      setPendingDeleteSlot(null);
      setSelectedSlot(null);
    },
    onError: (error) => {
      confirmDeleteSheetRef.current?.dismiss();
      setPendingDeleteSlot(null);
      setSelectedSlot(null);
      showError(error);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateTimeSlot(id),
    onSuccess: async () => {
      toast.success("Recorrência ativada novamente.");
      await invalidateTimeSlotAvailability();
      actionSheetRef.current?.dismiss();
      setSelectedSlot(null);
    },
    onError: (error) => {
      actionSheetRef.current?.dismiss();
      setSelectedSlot(null);
      showError(error);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateTimeSlot(id),
    onSuccess: async () => {
      toast.success("Recorrência desativada para as próximas semanas.");
      await invalidateTimeSlotAvailability();
      actionSheetRef.current?.dismiss();
      setSelectedSlot(null);
    },
    onError: (error) => {
      actionSheetRef.current?.dismiss();
      setSelectedSlot(null);
      showError(error);
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: (input: { slotId: string; date: string }) =>
      blockTimeSlotDate({ id: input.slotId, date: input.date }),
    onSuccess: async (_result, input) => {
      toast.success(`Horário bloqueado em ${input.date}.`);
      await invalidateTimeSlotAvailability();
      blockDateSheetRef.current?.dismiss();
      setSlotToBlock(null);
      setSelectedSlot(null);
    },
    onError: (error) => {
      blockDateSheetRef.current?.dismiss();
      setSlotToBlock(null);
      setSelectedSlot(null);
      showError(error);
    },
  });

  const unblockDateMutation = useMutation({
    mutationFn: (input: { slotId: string; date: string }) =>
      unblockTimeSlotDate({ id: input.slotId, date: input.date }),
    onSuccess: async (_result, input) => {
      toast.success(`Horário reativado em ${input.date}.`);
      await invalidateTimeSlotAvailability();
      blockDateSheetRef.current?.dismiss();
      setSlotToBlock(null);
      setSelectedSlot(null);
    },
    onError: (error) => {
      blockDateSheetRef.current?.dismiss();
      setSlotToBlock(null);
      setSelectedSlot(null);
      showError(error);
    },
  });

  const slotsByDay = TIME_SLOT_DAYS.map((day) => ({
    day,
    slots: (slots ?? [])
      .filter((slot) => slot.dayOfWeek === day.value)
      .sort((a, b) => a.time.localeCompare(b.time)),
  }));

  const handleOpenAddSheet = useCallback((dayOfWeek: number, label: string) => {
    setAddSheetDay({ dayOfWeek, label });
    addSheetRef.current?.present();
  }, []);

  const handleCloseAddSheet = useCallback(() => {
    setAddSheetDay(null);
  }, []);

  const handleManageSlot = useCallback((slot: BlockTimeSlotTarget) => {
    setSelectedSlot(slot);
    actionSheetRef.current?.present();
  }, []);

  const presentBlockDateSheet = useCallback(() => {
    setTimeout(() => {
      blockDateSheetRef.current?.present();
    }, 150);
  }, []);

  const presentDeleteSheet = useCallback(() => {
    setTimeout(() => {
      confirmDeleteSheetRef.current?.present();
    }, 150);
  }, []);

  const handleSelectAction = useCallback(
    (action: "activate" | "block-date" | "deactivate" | "delete") => {
      if (!selectedSlot) return;

      if (action === "activate") {
        activateMutation.mutate(selectedSlot.id);
        return;
      }

      if (action === "block-date") {
        setSlotToBlock(selectedSlot);
        actionSheetRef.current?.dismiss();
        presentBlockDateSheet();
        return;
      }

      if (action === "deactivate") {
        deactivateMutation.mutate(selectedSlot.id);
        return;
      }

      setPendingDeleteSlot(selectedSlot);
      actionSheetRef.current?.dismiss();
      presentDeleteSheet();
    },
    [deactivateMutation, presentBlockDateSheet, presentDeleteSheet, selectedSlot],
  );

  const busySlotId =
    (deleteMutation.isPending ? deleteMutation.variables : null) ??
    (activateMutation.isPending ? activateMutation.variables : null) ??
    (deactivateMutation.isPending ? deactivateMutation.variables : null) ??
    (unblockDateMutation.isPending ? unblockDateMutation.variables?.slotId : null) ??
    (blockDateMutation.isPending ? blockDateMutation.variables?.slotId : null);

  const actionOptions = selectedSlot?.active
    ? [
        {
          value: "block-date" as const,
          title: "Bloquear em uma data",
          description:
            "Mantém a recorrência semanal e bloqueia apenas um dia específico.",
          icon: <Feather name="calendar" size={18} color="#f43f5e" />,
          disabled:
            activateMutation.isPending ||
            deactivateMutation.isPending ||
            deleteMutation.isPending,
        },
        {
          value: "deactivate" as const,
          title: "Desativar recorrência",
          description:
            "Remove este horário das próximas semanas, sem mexer nos agendamentos já feitos.",
          icon: <Feather name="pause-circle" size={18} color="#f43f5e" />,
          loading: deactivateMutation.isPending,
          disabled:
            activateMutation.isPending ||
            deleteMutation.isPending ||
            blockDateMutation.isPending,
        },
        {
          value: "delete" as const,
          title: "Excluir definitivamente",
          description:
            "Use apenas se este horário nunca foi usado em agendamentos.",
          icon: <Feather name="trash-2" size={18} color="#ef4444" />,
          disabled:
            activateMutation.isPending ||
            deactivateMutation.isPending ||
            blockDateMutation.isPending,
        },
      ]
    : [
        {
          value: "activate" as const,
          title: "Ativar recorrência",
          description:
            "Torna este horário disponível novamente nas próximas semanas.",
          icon: <Feather name="play-circle" size={18} color="#16a34a" />,
          loading: activateMutation.isPending,
          disabled:
            deactivateMutation.isPending ||
            deleteMutation.isPending ||
            blockDateMutation.isPending,
        },
        {
          value: "delete" as const,
          title: "Excluir definitivamente",
          description:
            "Remove o horário do cadastro caso você não queira mais mantê-lo na agenda.",
          icon: <Feather name="trash-2" size={18} color="#ef4444" />,
          disabled:
            activateMutation.isPending ||
            deactivateMutation.isPending ||
            blockDateMutation.isPending,
        },
      ];

  const timeSlotsSection = (
    <View className="mb-4 rounded-[28px] border border-rose-100 bg-white p-4">
      <View className="mb-3 rounded-2xl bg-rose-50 p-4">
        <Text className="text-sm font-bold text-zinc-900">
          Organize seus horários da semana
        </Text>
        <Text className="mt-1 text-xs leading-5 text-zinc-500">
          Adicione, revise e remova os horários disponíveis de cada dia para
          manter sua agenda sempre atualizada.
        </Text>
      </View>

      {isLoading
        ? Array.from({ length: 6 }).map((_, index) => (
            <TimeSlotDayRowSkeleton key={index} />
          ))
        : slotsByDay.map(({ day, slots: daySlots }) => (
            <TimeSlotDayRow
              key={day.value}
              day={day}
              slots={daySlots}
              onAdd={() => handleOpenAddSheet(day.value, day.label)}
              busySlotId={busySlotId}
              onManage={handleManageSlot}
            />
          ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="px-5 pb-3 pt-3">
        <Text className="text-xl font-bold text-zinc-900">Horários</Text>
        <Text className="text-xs text-zinc-400">
          Configure seus horários disponíveis por dia da semana
        </Text>
      </View>

      {isLoading ? (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <ShareTimeSlotsCard />
          {timeSlotsSection}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <ShareTimeSlotsCard />
          {timeSlotsSection}
        </ScrollView>
      )}

      <AddTimeSheet
        day={addSheetDay}
        sheetRef={addSheetRef}
        onClose={handleCloseAddSheet}
      />

      <SelectionSheet
        sheetRef={actionSheetRef}
        title={selectedSlot ? `Horário ${selectedSlot.time}` : "Gerenciar horário"}
        description={
          selectedSlot
            ? `Escolha como deseja gerenciar ${selectedSlot.time} em ${selectedSlot.dayLabel?.toLowerCase() ?? "este dia"}.`
            : "Escolha uma ação para este horário."
        }
        onClose={() => setSelectedSlot(null)}
        onSelect={handleSelectAction}
        options={actionOptions}
      />

      <BlockTimeSlotDateSheet
        slot={slotToBlock}
        sheetRef={blockDateSheetRef}
        loading={blockDateMutation.isPending || unblockDateMutation.isPending}
        onClose={() => setSlotToBlock(null)}
        onConfirm={(input) => {
          if (input.action === "unblock") {
            unblockDateMutation.mutate(input);
            return;
          }

          blockDateMutation.mutate(input);
        }}
      />

      <ConfirmActionSheet
        sheetRef={confirmDeleteSheetRef}
        title="Remover horário"
        description={
          pendingDeleteSlot
            ? `Deseja remover o horário ${pendingDeleteSlot.time}?`
            : "Deseja remover este horário?"
        }
        confirmLabel="Remover horário"
        loading={deleteMutation.isPending}
        onClose={() => setPendingDeleteSlot(null)}
        onConfirm={() => {
          if (!pendingDeleteSlot) return;
          deleteMutation.mutate(pendingDeleteSlot.id);
        }}
      />
    </SafeAreaView>
  );
}

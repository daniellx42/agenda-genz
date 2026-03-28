import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import type { SheetTextInputRef } from "@/components/ui/sheet-text-input";
import { createTimeSlot } from "../api/time-slot-mutations";
import { timeSlotKeys } from "../api/time-slot-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { formatTime, isValidTime, normalizeTime } from "@/lib/formatters";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import type { TimeSlotDaySelection } from "../constants/time-slot-days";

interface AddTimeSheetProps {
  day: TimeSlotDaySelection | null;
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
}

export function AddTimeSheet({ day, sheetRef, onClose }: AddTimeSheetProps) {
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const timeInputRef = useRef<SheetTextInputRef>(null);
  const formSheet = useFormSheet({
    horizontalPadding: 24,
    bottomPadding: 24,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!day) {
        throw new Error("Selecione um dia para adicionar um horário.");
      }

      await createTimeSlot({
        dayOfWeek: day.dayOfWeek,
        time: normalizeTime(time),
      });
    },
    onSuccess: () => {
      toast.success("Horário adicionado!");
      void queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
      sheetRef.current?.dismiss();
    },
    onError: (mutationError) => {
      showError(mutationError);
      sheetRef.current?.dismiss();
    },
  });

  const resetForm = useCallback(() => {
    setTime("");
    setError("");
  }, []);

  const handleAdd = () => {
    if (!day) {
      setError("Selecione um dia antes de adicionar um horário.");
      requestAnimationFrame(() => {
        timeInputRef.current?.focus();
      });
      return;
    }

    const normalizedTime = normalizeTime(time);
    if (!isValidTime(normalizedTime)) {
      setError("Use o formato HH:MM (ex: 09:00)");
      requestAnimationFrame(() => {
        timeInputRef.current?.focus();
      });
      return;
    }

    setError("");
    setTime(normalizedTime);
    mutation.mutate();
  };

  const handleDismiss = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  return (
      <FormSheetModal
        ref={sheetRef}
        formSheet={formSheet}
        snapPoints={["48%"]}
        enablePanDownToClose={!mutation.isPending}
        onDismiss={handleDismiss}
        keyboardBehavior="fillParent"
      >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
        keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
        keyboardDismissMode={formSheet.keyboardDismissMode}
      >
        <Text className="mb-1 text-base font-bold text-zinc-900">
          Adicionar horário
        </Text>
        <Text className="mb-4 text-xs text-zinc-400">
          {day?.label ?? "Selecione um dia"}
        </Text>

        <SheetTextInput
          ref={timeInputRef}
          style={{
            marginBottom: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: error ? "#fca5a5" : "#e4e4e7",
            backgroundColor: "#fafafa",
            paddingHorizontal: 16,
            paddingVertical: 12,
            textAlign: "center",
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: 1.5,
            color: "#18181b",
          }}
          placeholder="09:00"
          placeholderTextColor="#a1a1aa"
          value={time}
          onChangeText={(value) => {
            setTime(formatTime(value));
            setError("");
          }}
          keyboardType="numeric"
          maxLength={5}
          editable={!mutation.isPending}
        />
        {error ? (
          <Text className="mb-3 text-center text-xs text-red-400">{error}</Text>
        ) : (
          <Text className="mb-3 text-center text-xs text-zinc-400">
            Formato: HH:MM
          </Text>
        )}

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={mutation.isPending}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3"
            style={{ opacity: mutation.isPending ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">
              Cancelar
            </Text>
          </Pressable>
          <Pressable
            onPress={handleAdd}
            disabled={mutation.isPending}
            className="flex-1 items-center rounded-2xl bg-rose-500 py-3 active:opacity-80"
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">Adicionar</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </FormSheetModal>
  );
}

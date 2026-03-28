import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { formatAppointmentShortDate } from "@/features/appointments/lib/appointment-date";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { Text, View } from "react-native";
import { StepClient } from "./new-appointment-step-client";
import { StepReview } from "./new-appointment-step-review";
import { StepService } from "./new-appointment-step-service";
import { StepTimeSlot } from "./new-appointment-step-time-slot";

interface Props {
  onDismiss: () => void;
  onRequestClose: () => void;
}

const SNAP_POINTS = ["75%", "92%"];

const STEP_LABELS = {
  client: "Cliente",
  service: "Serviço",
  slot: "Horário",
  review: "Confirmação",
};

export const NewAppointmentSheet = forwardRef<BottomSheetModal, Props>(
  function NewAppointmentSheet({ onDismiss, onRequestClose }, ref) {
    const { date, step, goBack } = useAppointmentDraft();
    const formSheet = useFormSheet();

    const canGoBack = step !== "client";

    return (
      <FormSheetModal
        ref={ref}
        formSheet={formSheet}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        onDismiss={onDismiss}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
          keyboardDismissMode={formSheet.keyboardDismissMode}
        >
          {/* Header */}
          <View className="mb-6 mt-2 flex-row items-start justify-between gap-3">
            {canGoBack ? (
              <View className="min-h-7 flex-row items-center gap-2">
                <Text
                  onPress={goBack}
                  className="text-rose-400 text-sm font-medium"
                >
                  ‹ Voltar
                </Text>
              </View>
            ) : (
              <View className="min-h-7" />
            )}

            <View className="flex-1 flex-row flex-wrap items-center justify-end gap-2">
              <View className="rounded-full bg-emerald-50 px-3 py-1">
                <Text className="text-emerald-700 text-xs font-semibold">
                  Data selecionada: {formatAppointmentShortDate(date)}
                </Text>
              </View>

              <View className="bg-blue-50 rounded-full px-3 py-1">
                <Text className="text-blue-500 text-xs font-semibold">
                  {STEP_LABELS[step]}
                </Text>
              </View>
            </View>
          </View>

          {/* Steps */}
          {step === "client" && <StepClient />}
          {step === "service" && <StepService />}
          {step === "slot" && <StepTimeSlot />}
          {step === "review" && <StepReview onClose={onRequestClose} />}
        </BottomSheetScrollView>
      </FormSheetModal>
    );
  },
);

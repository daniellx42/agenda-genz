import { formatAppointmentShortDate } from "@/features/appointments/lib/appointment-date";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useFormSheet } from "@/hooks/use-form-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback } from "react";
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

const Backdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.5}
  />
);

export const NewAppointmentSheet = forwardRef<BottomSheetModal, Props>(
  function NewAppointmentSheet({ onDismiss, onRequestClose }, ref) {
    const { date, step, goBack } = useAppointmentDraft();
    const formSheet = useFormSheet();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => <Backdrop {...props} />,
      [],
    );

    const canGoBack = step !== "client";

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={SNAP_POINTS}
        bottomInset={formSheet.bottomInset}
        enablePanDownToClose
        enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#e4e4e7", width: 40 }}
        backgroundStyle={{ backgroundColor: "white", borderRadius: 24 }}
        onDismiss={onDismiss}
        keyboardBehavior={formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
          keyboardDismissMode="interactive"
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
      </BottomSheetModal>
    );
  },
);

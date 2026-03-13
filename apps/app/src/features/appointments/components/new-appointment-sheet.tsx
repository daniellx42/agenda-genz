import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { useFormSheet } from "@/hooks/use-form-sheet";
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
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface Props {
  onClose: () => void;
}

const SNAP_POINTS = ["75%", "92%"];

const STEP_LABELS = {
  client: "1 · Cliente",
  service: "2 · Serviço",
  slot: "3 · Horário",
  review: "4 · Confirmação",
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
  function NewAppointmentSheet({ onClose }, ref) {
    const { step, goBack } = useAppointmentDraft();
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
        onDismiss={onClose}
        keyboardBehavior={formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6 mt-2">
            {canGoBack ? (
              <View className="flex-row items-center gap-2">
                <Text
                  onPress={goBack}
                  className="text-rose-400 text-sm font-medium"
                >
                  ‹ Voltar
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View className="bg-rose-50 rounded-full px-3 py-1">
              <Text className="text-rose-400 text-xs font-semibold">
                {STEP_LABELS[step]}
              </Text>
            </View>
          </View>

          {/* Steps */}
          {step === "client" && <StepClient />}
          {step === "service" && <StepService />}
          {step === "slot" && <StepTimeSlot />}
          {step === "review" && <StepReview onClose={onClose} />}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

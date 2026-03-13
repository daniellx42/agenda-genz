import Feather from "@expo/vector-icons/Feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface ConfirmActionSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
}

export function ConfirmActionSheet({
  sheetRef,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmActionSheetProps) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["38%"]}
      enablePanDownToClose={!loading}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#fbcfe8", width: 44 }}
      backgroundStyle={{ backgroundColor: "#fff9fb", borderRadius: 28 }}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
            <Feather name="alert-triangle" size={20} color="#ef4444" />
          </View>

          <Text className="mt-4 text-base font-bold text-zinc-900">
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            {description}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">
              {cancelLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            disabled={loading}
            className="flex-1 items-center rounded-2xl py-3.5 active:opacity-80"
            style={{
              backgroundColor: destructive ? "#f43f5e" : "#18181b",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                {confirmLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

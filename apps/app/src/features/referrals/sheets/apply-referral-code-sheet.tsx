import { SheetTextInput } from "@/components/ui/sheet-text-input";
import type { SheetTextInputRef } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import Feather from "@expo/vector-icons/Feather";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface ApplyReferralCodeSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  value: string;
  error: string;
  loading: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function ApplyReferralCodeSheet({
  sheetRef,
  value,
  error,
  loading,
  onChangeText,
  onSubmit,
  onClose,
}: ApplyReferralCodeSheetProps) {
  const codeInputRef = useRef<SheetTextInputRef>(null);
  const formSheet = useFormSheet({
    horizontalPadding: 24,
    bottomPadding: 24,
  });

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
      snapPoints={["48%"]}
      bottomInset={formSheet.bottomInset}
      enablePanDownToClose={false}
      enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#fbcfe8", width: 42 }}
      backgroundStyle={{ backgroundColor: "#fff9fb", borderRadius: 28 }}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
      android_keyboardInputMode={formSheet.androidKeyboardInputMode}
    >
      <BottomSheetView style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
            <Feather name="gift" size={20} color="#f43f5e" />
          </View>

          <Text className="mt-4 text-lg font-bold text-zinc-900">
            Voce tem um codigo de convite?
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            Se voce tiver um codigo valido, adicione abaixo e ganhe R$ 1,00.
            Esse convite pode ser usado apenas uma vez.
          </Text>

          <SheetTextInput
            ref={codeInputRef}
            style={{
              marginTop: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: error ? "#fca5a5" : "#fecdd3",
              backgroundColor: "#fff9fb",
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontWeight: "800",
              letterSpacing: 2,
              color: "#18181b",
              textTransform: "uppercase",
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="SEU-CODIGO"
            placeholderTextColor="#a1a1aa"
            value={value}
            onChangeText={onChangeText}
            editable={!loading}
            maxLength={16}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />

          <Text
            className={`mt-3 text-xs ${
              error ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {error || "Digite o codigo recebido e confirme abaixo."}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={onClose}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">Fechar</Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                Usar codigo de convite
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

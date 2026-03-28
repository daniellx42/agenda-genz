import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface DeleteAccountSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  value: string;
  loading?: boolean;
  canConfirm: boolean;
  confirmationText: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountSheet({
  sheetRef,
  value,
  loading = false,
  canConfirm,
  confirmationText,
  onChangeText,
  onClose,
  onConfirm,
}: DeleteAccountSheetProps) {
  const formSheet = useFormSheet({ bottomPadding: 20 });

  return (
    <FormSheetModal
      ref={sheetRef}
      formSheet={formSheet}
      theme="rose"
      backdropOpacity={0.45}
      snapPoints={["62%"]}
      enablePanDownToClose={!loading}
      onDismiss={onClose}
    >
      <BottomSheetView style={formSheet.viewContentContainerStyle}>
        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
            <Feather name="alert-triangle" size={20} color="#ef4444" />
          </View>

          <Text className="mt-4 text-base font-bold text-zinc-900">
            Tem certeza que quer deletar sua conta?
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            Essa ação remove sua conta, seus clientes, serviços, horários,
            agendamentos e todas as imagens relacionadas. Não será possível
            recuperar os dados depois.
          </Text>

          <View className="mt-5 gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
              Digite a frase para confirmar
            </Text>
            <Text className="text-sm font-semibold text-zinc-700">
              "{confirmationText}"
            </Text>
            <SheetTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={confirmationText}
              placeholderTextColor="#a1a1aa"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: "#fecdd3",
                borderRadius: 18,
                backgroundColor: "#fff9fb",
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#18181b",
              }}
            />
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">
              Cancelar
            </Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            disabled={!canConfirm || loading}
            className="flex-1 items-center rounded-2xl bg-red-500 py-3.5 active:opacity-80"
            style={{ opacity: !canConfirm || loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                Deletar conta
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </FormSheetModal>
  );
}

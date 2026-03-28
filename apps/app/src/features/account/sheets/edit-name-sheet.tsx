import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface EditNameSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  value: string;
  loading?: boolean;
  canSubmit: boolean;
  onChangeText: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function EditNameSheet({
  sheetRef,
  value,
  loading = false,
  canSubmit,
  onChangeText,
  onClose,
  onSubmit,
}: EditNameSheetProps) {
  const formSheet = useFormSheet({ bottomPadding: 20 });

  return (
    <FormSheetModal
      ref={sheetRef}
      formSheet={formSheet}
      theme="rose"
      backdropOpacity={0.45}
      snapPoints={["48%"]}
      enablePanDownToClose={!loading}
      onDismiss={onClose}
    >
      <BottomSheetView style={formSheet.viewContentContainerStyle}>
        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <Text className="text-base font-bold text-zinc-900">
            Editar nome
          </Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-500">
            Atualize como seu nome aparece nas telas do aplicativo.
          </Text>

          <View className="mt-5 gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
              Nome
            </Text>
            <SheetTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder="Digite seu nome"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
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
            onPress={onSubmit}
            disabled={!canSubmit || loading}
            className="flex-1 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            style={{ opacity: !canSubmit || loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                Salvar nome
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </FormSheetModal>
  );
}

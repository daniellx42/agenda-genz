import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import Feather from "@expo/vector-icons/Feather";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

interface ClientFollowUpShareSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  clientName: string;
  lastAppointmentLabel: string;
  highlightLabel: string;
  message: string;
  onChangeMessage: (value: string) => void;
  disableWhatsApp?: boolean;
  onDismiss?: () => void;
  onShareWhatsApp: () => void;
  onShareMore: () => void;
}

const SNAP_POINTS = ["78%", "90%"];

export function ClientFollowUpShareSheet({
  sheetRef,
  clientName,
  lastAppointmentLabel,
  highlightLabel,
  message,
  onChangeMessage,
  disableWhatsApp = false,
  onDismiss,
  onShareWhatsApp,
  onShareMore,
}: ClientFollowUpShareSheetProps) {
  const formSheet = useFormSheet({ bottomPadding: 28 });
  const canShare = message.trim().length > 0;

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
      snapPoints={SNAP_POINTS}
      bottomInset={formSheet.bottomInset}
      enablePanDownToClose
      enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#fbcfe8", width: 44 }}
      backgroundStyle={{ backgroundColor: "#fff9fb", borderRadius: 28 }}
      keyboardBehavior={formSheet.keyboardBehavior}
      keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
      android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
        keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
        keyboardDismissMode="interactive"
      >
        <View className="rounded-[28px] border border-rose-100 bg-white p-4">
          <Text className="text-base font-bold text-zinc-900">
            Reativar cliente
          </Text>
          <Text className="mt-1 text-sm leading-5 text-zinc-500">
            Compartilhe uma mensagem pronta para retomar o contato e convidar a
            cliente para um novo atendimento.
          </Text>

          {highlightLabel ? (
            <View className="mt-3 self-start rounded-full bg-rose-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-rose-500">
                {highlightLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4 rounded-[28px] border border-rose-100 bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Feather name="user" size={14} color="#52525b" />
            <Text className="flex-1 text-sm font-semibold text-zinc-800">
              {clientName}
            </Text>
          </View>

          <View className="mt-2 h-px bg-rose-100" />

          <View className="mt-3 flex-row items-center gap-2">
            <Feather name="calendar" size={14} color="#52525b" />
            <Text className="flex-1 text-sm text-zinc-600">
              Último atendimento em {lastAppointmentLabel}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center gap-2">
            <Feather name="message-circle" size={14} color="#52525b" />
            <Text className="flex-1 text-sm text-zinc-600">
              Convite pronto para marcar um novo horário
            </Text>
          </View>

          <View className="mt-4 rounded-2xl bg-zinc-50 p-4">
            <Text className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Mensagem editável
            </Text>
            <Text className="mt-1 text-xs leading-5 text-zinc-500">
              A mensagem já vem pronta, mas você pode ajustar antes de enviar.
            </Text>
            <SheetTextInput
              value={message}
              onChangeText={onChangeMessage}
              placeholder="Digite a mensagem"
              placeholderTextColor="#a1a1aa"
              autoCorrect={false}
              multiline
              numberOfLines={9}
              textAlignVertical="top"
              style={{
                marginTop: 12,
                minHeight: 180,
                borderWidth: 1,
                borderColor: "#e4e4e7",
                borderRadius: 18,
                backgroundColor: "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 14,
                lineHeight: 22,
                color: "#52525b",
              }}
            />
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={onShareWhatsApp}
            disabled={disableWhatsApp || !canShare}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 active:opacity-80"
            style={{ opacity: disableWhatsApp || !canShare ? 0.6 : 1 }}
          >
            <Feather name="message-circle" size={16} color="white" />
            <Text className="text-sm font-semibold text-white">WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={onShareMore}
            disabled={!canShare}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 active:opacity-80"
            style={{ opacity: !canShare ? 0.6 : 1 }}
          >
            <Feather name="share-2" size={16} color="white" />
            <Text className="text-sm font-semibold text-white">Outros apps</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => sheetRef.current?.dismiss()}
          className="mt-4 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-zinc-600">Fechar</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

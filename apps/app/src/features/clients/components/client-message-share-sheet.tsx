import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { type ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type HighlightTone = "rose" | "sky" | "red";
type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface ClientMessageShareFact {
  icon: FeatherIconName;
  text: string;
  emphasize?: boolean;
}

interface ClientMessageShareSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  title: string;
  description: string;
  clientName: string;
  message: string;
  onChangeMessage: (value: string) => void;
  facts: ClientMessageShareFact[];
  highlightLabel?: string | null;
  highlightTone?: HighlightTone;
  disableWhatsApp?: boolean;
  onDismiss?: () => void;
  onShareWhatsApp: () => void;
  onShareMore: () => void;
}

const SNAP_POINTS = ["78%", "90%"];

const HIGHLIGHT_STYLES: Record<
  HighlightTone,
  { container: string; text: string; icon: string }
> = {
  rose: {
    container: "bg-rose-50",
    text: "text-rose-500",
    icon: "#f43f5e",
  },
  sky: {
    container: "bg-sky-50",
    text: "text-sky-700",
    icon: "#0284c7",
  },
  red: {
    container: "bg-red-50",
    text: "text-red-600",
    icon: "#dc2626",
  },
};

export function ClientMessageShareSheet({
  sheetRef,
  title,
  description,
  clientName,
  message,
  onChangeMessage,
  facts,
  highlightLabel,
  highlightTone = "rose",
  disableWhatsApp = false,
  onDismiss,
  onShareWhatsApp,
  onShareMore,
}: ClientMessageShareSheetProps) {
  const formSheet = useFormSheet({ bottomPadding: 28 });
  const canShare = message.trim().length > 0;
  const highlightStyles = HIGHLIGHT_STYLES[highlightTone];

  return (
    <FormSheetModal
      ref={sheetRef}
      formSheet={formSheet}
      theme="rose"
      backdropOpacity={0.45}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
        keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
        keyboardDismissMode={formSheet.keyboardDismissMode}
      >
        <View className="rounded-[28px] border border-rose-100 bg-white p-4">
          <Text className="text-base font-bold text-zinc-900">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-zinc-500">
            {description}
          </Text>

          {highlightLabel ? (
            <View
              className={`mt-3 flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5 ${highlightStyles.container}`}
            >
              <Feather name="info" size={12} color={highlightStyles.icon} />
              <Text className={`text-xs font-semibold ${highlightStyles.text}`}>
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

          {facts.length > 0 ? <View className="mt-2 h-px bg-rose-100" /> : null}

          {facts.map((fact, index) => (
            <View
              key={`${fact.icon}-${index}`}
              className={`${index === 0 ? "mt-3" : "mt-2"} flex-row items-center gap-2`}
            >
              <Feather name={fact.icon} size={14} color="#52525b" />
              <Text
                className={`flex-1 text-sm ${fact.emphasize ? "font-semibold text-zinc-800" : "text-zinc-600"}`}
              >
                {fact.text}
              </Text>
            </View>
          ))}

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
    </FormSheetModal>
  );
}

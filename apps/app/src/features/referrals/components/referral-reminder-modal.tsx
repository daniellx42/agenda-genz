import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

interface ReferralReminderModalProps {
  visible: boolean;
  referralCode: string | null;
  hasCopiedCode: boolean;
  generatingCode: boolean;
  onGenerateCode: () => void;
  onCopyCode: () => void;
  onClose: () => void;
}

export function ReferralReminderModal({
  visible,
  referralCode,
  hasCopiedCode,
  generatingCode,
  onGenerateCode,
  onCopyCode,
  onClose,
}: ReferralReminderModalProps) {
  const hasCode = Boolean(referralCode);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-[360px] rounded-[32px] border border-rose-100 bg-white p-6">
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-rose-50">
            <Feather
              name={hasCode ? "share-2" : "gift"}
              size={24}
              color="#f43f5e"
            />
          </View>

          <Text className="mt-5 text-xl font-bold text-zinc-900">
            {hasCode
              ? "Nao esqueca de divulgar o aplicativo"
              : "Divulgue o app e ganhe com isso"}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-500">
            {hasCode
              ? "Grave videos do app para divulgar seu codigo. A cada pessoa que usar, voce e a pessoa ganham R$ 1,00. O saldo e os saques ficam na tela de Configuracoes."
              : "Quer divulgar o Agenda GenZ? Gere agora o seu codigo unico de convite e acompanhe os ganhos na tela de Configuracoes."}
          </Text>

          {hasCode ? (
            <View className="mt-5 rounded-[24px] border border-rose-100 bg-[#fff9fb] px-4 py-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-500">
                Seu codigo
              </Text>
              <Text
                selectable
                className="mt-2 text-2xl font-black tracking-[2px] text-zinc-900"
              >
                {referralCode}
              </Text>
            </View>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            {!hasCode ? (
              <Pressable
                onPress={onClose}
                className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-zinc-600">
                  Agora nao
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={hasCode ? onCopyCode : onGenerateCode}
              disabled={generatingCode}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 active:opacity-80 ${
                hasCode
                  ? hasCopiedCode
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                  : "bg-rose-500"
              }`}
              style={{ opacity: generatingCode ? 0.7 : 1 }}
            >
              {generatingCode ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather
                    name={hasCode ? (hasCopiedCode ? "check" : "copy") : "share-2"}
                    size={16}
                    color="white"
                  />
                  <Text className="text-sm font-bold text-white">
                    {hasCode
                      ? hasCopiedCode
                        ? "Copiado"
                        : "Copiar codigo"
                      : "Quero divulgar"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {hasCode ? (
            <Pressable
              onPress={onClose}
              className="mt-3 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-zinc-600">
                Fechar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

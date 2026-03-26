import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, Text, View } from "react-native";
import { STORE_UPDATE_MODAL_DESCRIPTION } from "../lib/store-platform";

interface StoreUpdateModalProps {
  visible: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  platform: "android" | "ios";
  onUpdate: () => void;
}

export function StoreUpdateModal({
  visible,
  currentVersion,
  latestVersion,
  platform,
  onUpdate,
}: StoreUpdateModalProps) {
  const shouldShowVersions =
    currentVersion !== null &&
    latestVersion !== null &&
    (platform === "ios" || latestVersion.includes("."));

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-[360px] rounded-[32px] border border-rose-100 bg-[#fff9fb] p-6">
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-rose-100">
            <Feather name="download-cloud" size={24} color="#e11d48" />
          </View>

          <Text className="mt-5 text-xl font-bold text-zinc-900">
            Nova atualização disponível
          </Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-500">
            Para continuar usando o Agenda GenZ, atualize agora.{" "}
            {STORE_UPDATE_MODAL_DESCRIPTION}
          </Text>

          {shouldShowVersions ? (
            <View className="mt-5 rounded-[24px] border border-rose-100 bg-white px-4 py-3">
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-rose-500">
                Versões
              </Text>
              <Text className="mt-2 text-sm text-zinc-600">
                Atual: {currentVersion}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-zinc-900">
                Nova: {latestVersion}
              </Text>
            </View>
          ) : null}

          <View className="mt-6">
            <Pressable
              onPress={onUpdate}
              className="items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-bold text-white">Atualizar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

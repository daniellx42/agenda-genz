import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, Text, View } from "react-native";

interface ReviewReminderModalProps {
  visible: boolean;
  onReviewNow: () => void;
  onReviewLater: () => void;
}

export function ReviewReminderModal({
  visible,
  onReviewNow,
  onReviewLater,
}: ReviewReminderModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-[360px] rounded-[32px] border border-amber-100 bg-[#fff9fb] p-6">
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-amber-100">
            <Feather name="star" size={24} color="#d97706" />
          </View>

          <Text className="mt-5 text-xl font-bold text-zinc-900">
            Curtiu usar o app?
          </Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-500">
            Sua avaliação na loja ajuda outras profissionais a conhecerem o
            Agenda GenZ e apoia a evolução do app.
          </Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onReviewLater}
              className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-zinc-600">
                Depois
              </Text>
            </Pressable>

            <Pressable
              onPress={onReviewNow}
              className="flex-1 items-center rounded-2xl bg-zinc-900 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-bold text-white">Avaliar app</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

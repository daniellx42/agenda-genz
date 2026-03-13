import { Pressable, Text, View } from "react-native";

interface AppointmentDetailHeaderProps {
  onBack: () => void;
}

export function AppointmentDetailHeader({
  onBack,
}: AppointmentDetailHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-2 pt-3">
      <Pressable
        onPress={onBack}
        className="h-10 w-10 items-center justify-center rounded-full bg-rose-50 active:opacity-70"
      >
        <Text className="text-base text-rose-500">‹</Text>
      </Pressable>
      <Text className="flex-1 text-lg font-bold text-zinc-900">
        Detalhes do Agendamento
      </Text>
    </View>
  );
}

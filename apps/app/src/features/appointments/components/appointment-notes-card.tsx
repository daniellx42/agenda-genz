import { Text, View } from "react-native";

interface AppointmentNotesCardProps {
  notes: string;
}

export function AppointmentNotesCard({ notes }: AppointmentNotesCardProps) {
  return (
    <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
      <Text className="mb-1 text-xs font-medium text-zinc-400">
        Observações
      </Text>
      <Text className="text-sm text-zinc-600">{notes}</Text>
    </View>
  );
}

import { AppointmentClientAvatar } from "./appointment-client-avatar";
import { formatPhone } from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";
import type { ClientItem } from "@/features/clients/types";

interface NewAppointmentClientOptionCardProps {
  client: ClientItem;
  onPress: () => void;
}

export function NewAppointmentClientOptionCard({
  client,
  onPress,
}: NewAppointmentClientOptionCardProps) {
  const { imageUrl: profileImageUrl } = useResolvedImage({
    imageKey: client.profileImageKey,
  });

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 flex-row items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 active:opacity-70"
    >
      <AppointmentClientAvatar
        name={client.name}
        profileImageUrl={profileImageUrl}
        profileImageKey={client.profileImageKey}
        size={40}
      />

      <View className="flex-1">
        <Text className="text-sm font-semibold text-zinc-900">
          {client.name}
        </Text>
        <Text className="text-xs text-zinc-400">
          {formatPhone(client.phone)}
        </Text>
      </View>

      <Feather name="chevron-right" size={16} color="#d4d4d8" />
    </Pressable>
  );
}

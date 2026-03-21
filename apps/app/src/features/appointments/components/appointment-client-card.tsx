import { AppointmentClientAvatar } from "./appointment-client-avatar";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AppointmentClientCardProps {
  name: string;
  phone: string;
  profileImageUrl: string | null;
  uploading: boolean;
  deleting: boolean;
  onProfileAction: () => void;
}

export function AppointmentClientCard({
  name,
  phone,
  profileImageUrl,
  uploading,
  deleting,
  onProfileAction,
}: AppointmentClientCardProps) {
  return (
    <View className="mb-4 flex-row items-center gap-4 rounded-2xl border border-rose-100 bg-white p-4">
      <View style={{ position: "relative" }}>
        <AppointmentClientAvatar
          name={name}
          profileImageUrl={profileImageUrl}
          size={56}
        />
        <Pressable
          onPress={onProfileAction}
          disabled={deleting || uploading}
          style={{ position: "absolute", bottom: -2, right: -2 }}
          className="h-6 w-6 items-center justify-center rounded-full bg-rose-500"
        >
          {deleting || uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather
              name={profileImageUrl ? "trash-2" : "edit-2"}
              size={11}
              color="white"
            />
          )}
        </Pressable>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-zinc-900">{name}</Text>
        <Text className="mt-0.5 text-sm text-zinc-400">{phone}</Text>
      </View>
    </View>
  );
}

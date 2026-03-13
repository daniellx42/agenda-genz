import { getInitial } from "../lib/appointment-images";
import { Image } from "expo-image";
import { Text, View } from "react-native";

interface AppointmentClientAvatarProps {
  name: string;
  profileImageUrl: string | null;
  size?: number;
}

export function AppointmentClientAvatar({
  name,
  profileImageUrl,
  size = 56,
}: AppointmentClientAvatarProps) {
  if (profileImageUrl) {
    return (
      <Image
        source={{ uri: profileImageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-rose-100"
    >
      <Text style={{ fontSize: size * 0.45, fontWeight: "700", color: "#f43f5e" }}>
        {getInitial(name)}
      </Text>
    </View>
  );
}

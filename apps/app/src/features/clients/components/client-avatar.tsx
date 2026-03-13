import { getInitial } from "../lib/client-image";
import { Image } from "expo-image";
import { View, Text } from "react-native";

interface ClientAvatarProps {
  name: string;
  size?: number;
  imageUrl?: string | null;
}

export function ClientAvatar({
  name,
  size = 48,
  imageUrl,
}: ClientAvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
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
      <Text
        style={{ fontSize: size * 0.42, fontWeight: "700", color: "#f43f5e" }}
      >
        {getInitial(name)}
      </Text>
    </View>
  );
}

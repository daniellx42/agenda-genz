import { getInitial } from "../lib/client-image";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

interface ProfileAvatarPickerProps {
  name?: string;
  uri: string | null;
  onPick: () => void;
  onClear: () => void;
}

export function ProfileAvatarPicker({
  name,
  uri,
  onPick,
  onClear,
}: ProfileAvatarPickerProps) {
  const initial = name && name.length >= 1 ? getInitial(name) : null;

  if (uri) {
    return (
      <View style={{ position: "relative", width: 80, height: 80 }}>
        <Image
          source={{ uri }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
          contentFit="cover"
        />
        <Pressable
          onPress={onClear}
          style={{ position: "absolute", top: -2, right: -2 }}
          className="h-6 w-6 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
        >
          <Feather name="trash-2" size={11} color="white" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={onPick} className="active:opacity-70">
      <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-rose-200 bg-rose-50">
        {initial ? (
          <Text
            key="profile-avatar-initial"
            style={{ fontSize: 32, fontWeight: "700", color: "#f43f5e" }}
          >
            {initial}
          </Text>
        ) : (
          <Feather name="camera" size={24} color="#f43f5e" />
        )}
      </View>
      <View
        style={{ position: "absolute", bottom: -2, right: -2 }}
        className="h-6 w-6 items-center justify-center rounded-full bg-rose-500"
      >
        <Feather name="edit-2" size={11} color="white" />
      </View>
    </Pressable>
  );
}

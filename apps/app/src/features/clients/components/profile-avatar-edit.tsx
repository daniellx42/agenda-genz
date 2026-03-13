import { getInitial } from "../lib/client-image";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface ProfileAvatarEditProps {
  name: string;
  existingImageUrl: string | null;
  localUri: string | null;
  uploading: boolean;
  deleting: boolean;
  onPick: () => void;
  onClearLocal: () => void;
  onDelete: () => void;
}

export function ProfileAvatarEdit({
  name,
  existingImageUrl,
  localUri,
  uploading,
  deleting,
  onPick,
  onClearLocal,
  onDelete,
}: ProfileAvatarEditProps) {
  const busy = uploading || deleting;

  if (localUri) {
    return (
      <View style={{ position: "relative", width: 80, height: 80 }}>
        <Image
          source={{ uri: localUri }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
          contentFit="cover"
        />
        <Pressable
          onPress={onClearLocal}
          style={{ position: "absolute", top: -2, right: -2 }}
          className="h-6 w-6 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
        >
          <Text style={{ color: "white", fontSize: 11 }}>🗑</Text>
        </Pressable>
      </View>
    );
  }

  if (existingImageUrl) {
    return (
      <View style={{ position: "relative", width: 80, height: 80 }}>
        <Image
          source={{ uri: existingImageUrl }}
          style={{ width: 80, height: 80, borderRadius: 40 }}
          contentFit="cover"
        />
        <Pressable
          onPress={onDelete}
          disabled={busy}
          style={{ position: "absolute", top: -2, right: -2 }}
          className="h-6 w-6 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
        >
          {busy ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontSize: 11 }}>🗑</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={onPick} disabled={busy} className="active:opacity-70">
      <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-rose-200 bg-rose-100">
        {busy ? (
          <ActivityIndicator color="#f43f5e" />
        ) : (
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#f43f5e" }}>
            {getInitial(name)}
          </Text>
        )}
      </View>
      {!busy && (
        <View
          style={{ position: "absolute", bottom: -2, right: -2 }}
          className="h-6 w-6 items-center justify-center rounded-full bg-rose-500"
        >
          <Text style={{ color: "white", fontSize: 11 }}>✎</Text>
        </View>
      )}
    </Pressable>
  );
}

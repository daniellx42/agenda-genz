import Feather from "@expo/vector-icons/Feather";
import { RemoteImage } from "@/lib/media/remote-image";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AppointmentImageUploadCardProps {
  label: string;
  imageUrl: string | null;
  imageCacheKey?: string | null;
  uploading: boolean;
  deleting: boolean;
  onUpload: () => void;
  onPress: () => void;
  onDelete: () => void;
}

export function AppointmentImageUploadCard({
  label,
  imageUrl,
  imageCacheKey,
  uploading,
  deleting,
  onUpload,
  onPress,
  onDelete,
}: AppointmentImageUploadCardProps) {
  if (imageUrl) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 overflow-hidden rounded-2xl border border-rose-100 bg-white active:opacity-80"
        style={{ minHeight: 140 }}
      >
        <View>
          <RemoteImage
            imageUrl={imageUrl}
            imageCacheKey={imageCacheKey}
            style={{ width: "100%", height: 120 }}
            contentFit="cover"
          />
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={deleting}
            style={{ position: "absolute", top: 6, right: 6 }}
            className="h-7 w-7 items-center justify-center rounded-full bg-black/50 active:opacity-70"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="trash-2" size={13} color="white" />
            )}
          </Pressable>
        </View>
        <View className="flex-row items-center gap-1.5 px-3 py-2">
          <Text className="text-xs font-semibold text-zinc-700">{label}</Text>
          <Feather name="check" size={12} color="#10b981" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onUpload}
      disabled={uploading}
      className="flex-1 items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white active:opacity-70"
      style={{ minHeight: 140 }}
    >
      {uploading ? (
        <ActivityIndicator color="#f43f5e" />
      ) : (
        <>
          <Feather
            name="camera"
            size={24}
            color="#f43f5e"
            style={{ marginBottom: 8 }}
          />
          <Text className="text-xs font-semibold text-zinc-600">{label}</Text>
          <Text className="mt-1 text-xs text-zinc-400">Toque para enviar</Text>
        </>
      )}
    </Pressable>
  );
}

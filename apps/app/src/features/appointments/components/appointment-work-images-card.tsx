import { Text, View } from "react-native";
import type { ImageSlot } from "../lib/appointment-images";
import { AppointmentImageUploadCard } from "./appointment-image-upload-card";

interface AppointmentWorkImagesCardProps {
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  beforeImageKey: string | null;
  afterImageKey: string | null;
  uploadingSlot: ImageSlot | null;
  deletingSlot: ImageSlot | null;
  onUpload: (slot: ImageSlot) => void;
  onOpenViewer: (url: string | null, imageKey: string | null, label: string) => void;
  onDelete: (slot: ImageSlot) => void;
}

export function AppointmentWorkImagesCard({
  beforeImageUrl,
  afterImageUrl,
  beforeImageKey,
  afterImageKey,
  uploadingSlot,
  deletingSlot,
  onUpload,
  onOpenViewer,
  onDelete,
}: AppointmentWorkImagesCardProps) {
  return (
    <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
      <Text className="mb-4 text-sm font-semibold text-zinc-500">
        Imagens de Antes e Depois do serviço
      </Text>

      <View className="flex-row gap-3">
        <AppointmentImageUploadCard
          label="Antes"
          imageUrl={beforeImageUrl}
          imageCacheKey={beforeImageKey}
          uploading={uploadingSlot === "before"}
          deleting={deletingSlot === "before"}
          onUpload={() => onUpload("before")}
          onPress={() => onOpenViewer(beforeImageUrl, beforeImageKey, "Antes")}
          onDelete={() => onDelete("before")}
        />
        <AppointmentImageUploadCard
          label="Depois"
          imageUrl={afterImageUrl}
          imageCacheKey={afterImageKey}
          uploading={uploadingSlot === "after"}
          deleting={deletingSlot === "after"}
          onUpload={() => onUpload("after")}
          onPress={() => onOpenViewer(afterImageUrl, afterImageKey, "Depois")}
          onDelete={() => onDelete("after")}
        />
      </View>
    </View>
  );
}

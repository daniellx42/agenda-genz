import {
  saveImageToGallery,
  shareRemoteImage,
} from "../lib/appointment-images";
import { RemoteImage } from "@/lib/media/remote-image";
import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Text } from "react-native";

interface AppointmentImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  imageCacheKey?: string | null;
  label: string;
  onClose: () => void;
}

export function AppointmentImageViewerModal({
  visible,
  imageUrl,
  imageCacheKey,
  label,
  onClose,
}: AppointmentImageViewerModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imageUrl) return;

    setDownloading(true);
    try {
      await saveImageToGallery(imageUrl, label);
      toast.success("Imagem salva na galeria!");
    } catch (error) {
      if (error instanceof Error && error.message === "Permissão necessária") {
        toast.error("Permita o acesso à galeria para salvar a imagem.");
      } else {
        toast.error("Erro ao salvar imagem");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      await shareRemoteImage(imageUrl, label);
    } catch {
      toast.error("Erro ao compartilhar imagem");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)" }}>
        <SafeAreaView edges={["top"]}>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-base font-semibold text-white">{label}</Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center active:opacity-70"
            >
              <Feather name="x" size={22} color="white" />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={{ flex: 1 }} className="items-center justify-center px-4">
          {imageUrl && (
            <RemoteImage
              imageUrl={imageUrl}
              imageCacheKey={imageCacheKey}
              style={{ width: "100%", aspectRatio: 1 }}
              contentFit="contain"
            />
          )}
        </View>

        <SafeAreaView edges={["bottom"]}>
          <View className="flex-row gap-3 px-5 pb-6 pt-4">
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
              className="flex-1 items-center rounded-2xl bg-white/10 py-3 active:opacity-70"
            >
              {downloading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Feather name="download" size={16} color="white" />
                  <Text className="text-sm font-semibold text-white">Salvar</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="flex-1 items-center rounded-2xl bg-rose-500 py-3 active:opacity-70"
            >
              <View className="flex-row items-center gap-2">
                <Feather name="share" size={16} color="white" />
                <Text className="text-sm font-semibold text-white">
                  Compartilhar
                </Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

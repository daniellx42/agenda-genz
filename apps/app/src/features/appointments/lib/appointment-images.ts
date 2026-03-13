import { toast } from "sonner-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import type { ImagePickerAsset, ImagePickerResult } from "expo-image-picker";
export { formatAppointmentDate } from "./appointment-date";

export type ImageSlot = "before" | "after";

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export async function pickSquareImage(
  source: "camera" | "gallery",
  quality = 0.85,
): Promise<ImagePickerAsset | null> {
  let result: ImagePickerResult;

  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return null;

    result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality,
      allowsEditing: true,
      aspect: [1, 1],
    });
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality,
      allowsEditing: true,
      aspect: [1, 1],
    });
  }

  return !result.canceled && result.assets[0] ? result.assets[0] : null;
}

export async function saveImageToGallery(imageUrl: string, label: string) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permissão necessária");
  }

  const filename = `agendamento-${label}-${Date.now()}.jpg`;
  const localUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.downloadAsync(imageUrl, localUri);
  await MediaLibrary.saveToLibraryAsync(localUri);
}

export async function shareRemoteImage(imageUrl: string, label: string) {
  const filename = `agendamento-${label}-${Date.now()}.jpg`;
  const localUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.downloadAsync(imageUrl, localUri);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    toast.error("Compartilhamento não disponível neste dispositivo");
    return;
  }

  await Sharing.shareAsync(localUri, {
    mimeType: "image/jpeg",
    dialogTitle: `Compartilhar foto — ${label}`,
  });
}

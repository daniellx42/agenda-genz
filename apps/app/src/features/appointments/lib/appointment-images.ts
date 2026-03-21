import { toast } from "sonner-native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
export { formatAppointmentDate } from "./appointment-date";

export type ImageSlot = "before" | "after";

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
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

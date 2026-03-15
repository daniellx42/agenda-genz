import { uploadImageAsset } from "@/lib/api/image-upload";
import type { ApiErrorHandler } from "@/lib/api/query-utils";
import { toast } from "sonner-native";
import * as ImagePicker from "expo-image-picker";

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export async function pickImageFromSource(
  source: "camera" | "gallery",
): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

export async function uploadImageToR2(
  uri: string,
  folder: "profile" | "services",
  showError: ApiErrorHandler,
): Promise<string | undefined> {
  return uploadImageAsset(
    {
      uri,
    },
    folder,
    showError,
  );
}

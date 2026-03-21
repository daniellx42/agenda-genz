import { getFilenameFromUri } from "@/lib/api/image-upload";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset, ImagePickerResult } from "expo-image-picker";

export type ImageSource = "camera" | "gallery";

export interface SquareImageCropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface SquareImageProcessOptions {
  quality?: number;
  outputSize?: number;
}

function getSafeImageDimension(value: number | undefined, fallback = 1) {
  return value && value > 0 ? value : fallback;
}

function buildCroppedFilename(originalFileName: string | null | undefined) {
  const sourceName = originalFileName ?? "photo.jpg";
  return sourceName.replace(/\.[^.]+$/, "") + "-square.jpg";
}

function normalizeSquareCrop(
  asset: ImagePickerAsset,
  crop: SquareImageCropRect,
): SquareImageCropRect {
  const assetWidth = getSafeImageDimension(asset.width, crop.width);
  const assetHeight = getSafeImageDimension(asset.height, crop.height);
  const desiredSize = Math.max(1, Math.min(crop.width, crop.height));
  const maxSize = Math.max(1, Math.min(assetWidth, assetHeight));
  const size = Math.min(desiredSize, maxSize);
  const maxOriginX = Math.max(0, assetWidth - size);
  const maxOriginY = Math.max(0, assetHeight - size);

  return {
    originX: Math.round(Math.min(Math.max(crop.originX, 0), maxOriginX)),
    originY: Math.round(Math.min(Math.max(crop.originY, 0), maxOriginY)),
    width: Math.round(size),
    height: Math.round(size),
  };
}

export async function pickImageAssetFromSource(
  source: ImageSource,
  quality = 1,
): Promise<ImagePickerAsset | null> {
  let result: ImagePickerResult;

  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return null;

    result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality,
      allowsEditing: false,
    });
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality,
      allowsEditing: false,
    });
  }

  return !result.canceled && result.assets[0] ? result.assets[0] : null;
}

export async function cropImageAssetToSquare(
  asset: ImagePickerAsset,
  crop: SquareImageCropRect,
  { quality = 0.85, outputSize = 1080 }: SquareImageProcessOptions = {},
): Promise<ImagePickerAsset> {
  const normalizedCrop = normalizeSquareCrop(asset, crop);
  const finalSize = Math.max(320, Math.round(outputSize));
  const result = await ImageManipulator.manipulateAsync(
    asset.uri,
    [
      { crop: normalizedCrop },
      { resize: { width: finalSize, height: finalSize } },
    ],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    ...asset,
    uri: result.uri,
    width: result.width,
    height: result.height,
    type: "image",
    fileName: buildCroppedFilename(asset.fileName ?? getFilenameFromUri(asset.uri)),
    mimeType: "image/jpeg",
  };
}

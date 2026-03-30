import { uploadImageAsset, type UploadImageSource } from "@/lib/api/image-upload";
import type { ApiErrorHandler } from "@/lib/api/query-utils";
import type { UploadFolder } from "@/lib/api/image-upload";

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export async function uploadImageToR2(
  source: UploadImageSource,
  folder: UploadFolder,
  showError: ApiErrorHandler,
): Promise<string | undefined> {
  return uploadImageAsset(source, folder, showError);
}

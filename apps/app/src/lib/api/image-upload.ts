import {
  FileSystemUploadType,
  copyAsync,
  deleteAsync,
  makeDirectoryAsync,
  uploadAsync,
  cacheDirectory,
} from "expo-file-system/legacy";
import { toast } from "sonner-native";
import { createPresignedUpload } from "./upload-query-options";
import type { ApiErrorHandler } from "./query-utils";

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

const TEMP_UPLOAD_DIRECTORY = cacheDirectory
  ? `${cacheDirectory}uploads/`
  : null;

export type UploadFolder = "profile" | "services";

export interface UploadImageSource {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export function getMimeFromUri(uri: string): string {
  const normalizedUri = uri.toLowerCase();

  if (normalizedUri.endsWith(".png")) return "image/png";
  if (normalizedUri.endsWith(".webp")) return "image/webp";
  if (normalizedUri.endsWith(".heic")) return "image/heic";
  if (normalizedUri.endsWith(".heif")) return "image/heif";
  if (normalizedUri.endsWith(".gif")) return "image/gif";

  return "image/jpeg";
}

export function getFilenameFromUri(uri: string): string {
  const withoutQuery = uri.split("?")[0] ?? uri;
  return withoutQuery.split("/").pop() ?? "photo.jpg";
}

export function isAllowedImageMimeType(contentType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(
    contentType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
  );
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

async function getUploadableFileUri(
  source: UploadImageSource,
): Promise<{ fileUri: string; temporaryFileUri?: string }> {
  if (source.uri.startsWith("file://")) {
    return { fileUri: source.uri };
  }

  if (!TEMP_UPLOAD_DIRECTORY) {
    throw new Error("Diretório temporário indisponível para upload.");
  }

  await makeDirectoryAsync(TEMP_UPLOAD_DIRECTORY, { intermediates: true });

  const fallbackFilename = source.fileName ?? getFilenameFromUri(source.uri);
  const temporaryFileUri = `${TEMP_UPLOAD_DIRECTORY}${Date.now()}-${sanitizeFilename(fallbackFilename)}`;

  await copyAsync({
    from: source.uri,
    to: temporaryFileUri,
  });

  return {
    fileUri: temporaryFileUri,
    temporaryFileUri,
  };
}

export async function uploadImageAsset(
  source: UploadImageSource,
  folder: UploadFolder,
  handleError?: ApiErrorHandler,
): Promise<string | undefined> {
  const filename = source.fileName ?? getFilenameFromUri(source.uri);
  const contentType = source.mimeType ?? getMimeFromUri(source.uri);

  if (!isAllowedImageMimeType(contentType)) {
    toast.error("Tipo de imagem inválido.");
    return undefined;
  }

  let temporaryFileUri: string | undefined;

  try {
    const presigned = await createPresignedUpload(
      {
        folder,
        filename,
        contentType,
      },
      handleError,
    );

    if (!presigned) {
      return undefined;
    }

    const uploadable = await getUploadableFileUri(source);
    temporaryFileUri = uploadable.temporaryFileUri;

    const response = await uploadAsync(presigned.uploadUrl, uploadable.fileUri, {
      httpMethod: "PUT",
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      toast.error("Erro ao enviar imagem. Tente novamente.");
      return undefined;
    }

    return presigned.key;
  } catch (error) {
    handleError?.(error);
    toast.error("Erro ao enviar imagem. Tente novamente.");
    return undefined;
  } finally {
    if (temporaryFileUri) {
      await deleteAsync(temporaryFileUri, { idempotent: true }).catch(() => {
        return undefined;
      });
    }
  }
}

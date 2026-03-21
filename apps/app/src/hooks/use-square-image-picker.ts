import {
  cropImageAssetToSquare,
  pickImageAssetFromSource,
  type ImageSource,
  type SquareImageCropRect,
} from "@/lib/media/square-image";
import { useCallback, useRef, useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import { toast } from "sonner-native";

interface PickSquareImageOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  quality?: number;
  outputSize?: number;
}

interface PendingCropRequest extends Required<PickSquareImageOptions> {
  asset: ImagePickerAsset;
}

const DEFAULT_OPTIONS: Required<PickSquareImageOptions> = {
  title: "Ajustar imagem",
  description:
    "Enquadre a foto para manter o visual bonito e consistente no aplicativo.",
  confirmLabel: "Usar imagem",
  quality: 0.85,
  outputSize: 1080,
};

export function useSquareImagePicker() {
  const [pendingCrop, setPendingCrop] = useState<PendingCropRequest | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const resolverRef = useRef<((asset: ImagePickerAsset | null) => void) | null>(
    null,
  );

  const closeCropper = useCallback(() => {
    setPendingCrop(null);
    setProcessing(false);
    resolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(null);
    closeCropper();
  }, [closeCropper]);

  const handleConfirm = useCallback(
    async (crop: SquareImageCropRect) => {
      if (!pendingCrop) return;

      setProcessing(true);
      try {
        const croppedAsset = await cropImageAssetToSquare(
          pendingCrop.asset,
          crop,
          {
            quality: pendingCrop.quality,
            outputSize: pendingCrop.outputSize,
          },
        );

        resolverRef.current?.(croppedAsset);
        closeCropper();
      } catch {
        setProcessing(false);
        toast.error("Nao foi possivel preparar a imagem. Tente novamente.");
      }
    },
    [closeCropper, pendingCrop],
  );

  const pickSquareImage = useCallback(
    async (
      source: ImageSource,
      options: PickSquareImageOptions = {},
    ): Promise<ImagePickerAsset | null> => {
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      const asset = await pickImageAssetFromSource(source);
      if (!asset) return null;

      return new Promise<ImagePickerAsset | null>((resolve) => {
        resolverRef.current = resolve;
        setPendingCrop({
          asset,
          ...mergedOptions,
        });
      });
    },
    [],
  );

  return {
    pickSquareImage,
    cropperProps: {
      visible: Boolean(pendingCrop),
      asset: pendingCrop?.asset ?? null,
      title: pendingCrop?.title ?? DEFAULT_OPTIONS.title,
      description: pendingCrop?.description ?? DEFAULT_OPTIONS.description,
      confirmLabel: pendingCrop?.confirmLabel ?? DEFAULT_OPTIONS.confirmLabel,
      processing,
      onCancel: handleCancel,
      onConfirm: handleConfirm,
    },
  };
}

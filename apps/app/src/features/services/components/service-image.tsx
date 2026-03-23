import { useApiError } from "@/hooks/use-api-error";
import { RemoteImage } from "@/lib/media/remote-image";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import Feather from "@expo/vector-icons/Feather";
import { Image, type ImageErrorEventData, type ImageLoadEventData } from "expo-image";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

interface ServiceImageProps {
  imageKey: string | null;
  previewUri?: string | null;
  backgroundColor?: string | null;
  size?: number;
  borderRadius?: number;
  iconSize?: number;
}

export function ServiceImage({
  imageKey,
  previewUri = null,
  backgroundColor,
  size = 48,
  borderRadius = 16,
  iconSize,
}: ServiceImageProps) {
  const { showError } = useApiError();
  const lastResolutionSignatureRef = useRef<string | null>(null);
  const {
    imageUrl,
    imageCacheKey,
    isLoading,
    fetchStatus,
    dataUpdatedAt,
    initialUrlCacheHit,
  } = useResolvedImage({
    imageKey,
    previewUri,
    handleError: showError,
  });

  const shouldDebugImageCache =
    !!imageKey
    && !previewUri;
  const fallbackBackgroundColor = backgroundColor ?? "#fff1f2";
  const resolvedIconSize = iconSize ?? Math.max(18, Math.round(size * 0.42));

  useEffect(() => {
    if (!shouldDebugImageCache || !imageUrl || !imageCacheKey) {
      return;
    }

    const resolutionSignature = `${imageKey ?? ""}:${imageUrl}:${dataUpdatedAt}`;

    if (lastResolutionSignatureRef.current === resolutionSignature) {
      return;
    }

    lastResolutionSignatureRef.current = resolutionSignature;

    let didCancel = false;

    void Image.getCachePathAsync(imageCacheKey).then((cachePath) => {
      if (didCancel) return;
    });

    return () => {
      didCancel = true;
    };
  }, [
    dataUpdatedAt,
    fetchStatus,
    imageCacheKey,
    imageKey,
    imageUrl,
    initialUrlCacheHit,
    shouldDebugImageCache,
  ]);

  function handleLoad(event: ImageLoadEventData) {
    if (!shouldDebugImageCache || !imageUrl) {
      return;
    }
  }

  function handleError(event: ImageErrorEventData) {
    if (!shouldDebugImageCache || !imageUrl) {
      return;
    }
  }

  if (imageUrl) {
    return (
      <RemoteImage
        imageUrl={imageUrl}
        imageCacheKey={imageCacheKey}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: fallbackBackgroundColor,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color="#f43f5e" size="small" />
      ) : (
        <Feather name="scissors" size={resolvedIconSize} color="#f43f5e" />
      )}
    </View>
  );
}

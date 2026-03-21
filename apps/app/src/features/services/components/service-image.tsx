import { useApiError } from "@/hooks/use-api-error";
import { imageUrlQueryOptions } from "@/lib/api/upload-query-options";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
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
  const query = imageUrlQueryOptions(imageKey, showError);
  const { data: remoteImageUrl, isLoading } = useQuery({
    ...query,
    enabled: !previewUri && !!imageKey,
  });

  const imageUrl = previewUri ?? remoteImageUrl ?? null;
  const fallbackBackgroundColor = backgroundColor ?? "#fff1f2";
  const resolvedIconSize = iconSize ?? Math.max(18, Math.round(size * 0.42));

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
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

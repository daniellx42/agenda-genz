import { getRemoteImageSource } from "@/lib/media/remote-image-source";
import { Image } from "expo-image";
import type { ComponentProps } from "react";

interface RemoteImageProps extends Omit<ComponentProps<typeof Image>, "source"> {
  imageUrl: string;
  imageCacheKey?: string | null;
}

export function RemoteImage({
  imageUrl,
  imageCacheKey,
  ...props
}: RemoteImageProps) {
  return (
    <Image
      source={getRemoteImageSource(imageUrl, imageCacheKey)}
      {...props}
    />
  );
}

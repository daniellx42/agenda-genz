export function isExternalImageUrl(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function getStoredProfileImageKey(
  userId: string | null | undefined,
  value: string | null | undefined,
) {
  return isOwnedProfileImageKey(userId, value) ? value : null;
}

export function isOwnedProfileImageKey(
  userId: string | null | undefined,
  value: string | null | undefined,
): value is string {
  return (
    typeof userId === "string" &&
    userId.length > 0 &&
    typeof value === "string" &&
    (value.startsWith(`profiles/${userId}/`))
  );
}

interface BuildSettingsProfileImageStateParams {
  userId: string | null | undefined;
  imageValue: string | null | undefined;
  resolvedStoredImageUrl: string | null | undefined;
  resolvedStoredImageCacheKey: string | null | undefined;
  hasLocalImage?: boolean;
}

export function buildSettingsProfileImageState({
  userId,
  imageValue,
  resolvedStoredImageUrl,
  resolvedStoredImageCacheKey,
  hasLocalImage = false,
}: BuildSettingsProfileImageStateParams) {
  const storedProfileImageKey = getStoredProfileImageKey(userId, imageValue);
  const displayedProfileImageUrl = storedProfileImageKey
    ? resolvedStoredImageUrl ?? null
    : isExternalImageUrl(imageValue)
      ? imageValue
      : null;
  const displayedProfileImageCacheKey = storedProfileImageKey
    ? resolvedStoredImageCacheKey ?? storedProfileImageKey
    : null;
  const isLoadingStoredProfileImage =
    Boolean(storedProfileImageKey) &&
    !resolvedStoredImageUrl &&
    !hasLocalImage;

  return {
    storedProfileImageKey,
    displayedProfileImageUrl,
    displayedProfileImageCacheKey,
    isLoadingStoredProfileImage,
  };
}

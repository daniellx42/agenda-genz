export function getRemoteImageSource(
  uri: string,
  cacheKey?: string | null,
) {
  if (cacheKey) {
    return { uri, cacheKey };
  }

  return { uri };
}

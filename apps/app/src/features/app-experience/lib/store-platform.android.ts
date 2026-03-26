import Constants from "expo-constants";

const GOOGLE_PLAY_DEEP_LINK_PREFIX = "market://details?id=";
const GOOGLE_PLAY_WEB_LINK_PREFIX =
  "https://play.google.com/store/apps/details?id=";

export const UPDATE_CHECK_DESCRIPTION =
  "Veja se existe uma nova versão publicada na Google Play.";

export const STORE_UPDATE_MODAL_DESCRIPTION =
  "A atualização será iniciada pela Google Play dentro do app.";

function getAndroidPackageName(): string | null {
  return Constants.expoConfig?.android?.package ?? null;
}

export function getDefaultStoreUpdateUrl(): string | null {
  const packageName = getAndroidPackageName();

  if (!packageName) {
    return null;
  }

  return `${GOOGLE_PLAY_DEEP_LINK_PREFIX}${packageName}`;
}

export function getStoreOpenUrls(storeUrl: string | null): string[] {
  const packageName = getAndroidPackageName();
  const candidates = new Set<string>();

  if (storeUrl) {
    candidates.add(storeUrl);
  }

  if (packageName) {
    candidates.add(`${GOOGLE_PLAY_DEEP_LINK_PREFIX}${packageName}`);
    candidates.add(`${GOOGLE_PLAY_WEB_LINK_PREFIX}${packageName}`);
  }

  return [...candidates];
}

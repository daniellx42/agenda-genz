import Constants from "expo-constants";

export const UPDATE_CHECK_DESCRIPTION =
  "Veja se existe uma nova versão publicada na App Store.";

export const STORE_UPDATE_MODAL_DESCRIPTION =
  "Você será levado para a App Store.";

export function getDefaultStoreUpdateUrl(): string | null {
  return Constants.expoConfig?.ios?.appStoreUrl ?? null;
}

export function getStoreOpenUrls(storeUrl: string | null): string[] {
  if (!storeUrl) {
    return [];
  }

  if (!storeUrl.startsWith("https://")) {
    return [storeUrl];
  }

  return [storeUrl.replace("https://", "itms-apps://"), storeUrl];
}

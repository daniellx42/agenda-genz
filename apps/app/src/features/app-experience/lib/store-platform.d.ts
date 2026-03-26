export const UPDATE_CHECK_DESCRIPTION: string;
export const STORE_UPDATE_MODAL_DESCRIPTION: string;

export function getDefaultStoreUpdateUrl(): string | null;
export function getStoreOpenUrls(storeUrl: string | null): string[];

import type { PendingCheckoutSnapshot } from "./billing-flow";

const PENDING_CHECKOUT_KEY = "billing.pending_checkout";

export interface PendingCheckoutStore {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
}

export function isPendingCheckoutSnapshot(
  value: unknown,
): value is PendingCheckoutSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "paymentId" in value &&
    typeof value.paymentId === "string" &&
    "planId" in value &&
    typeof value.planId === "string" &&
    "planName" in value &&
    typeof value.planName === "string" &&
    "amount" in value &&
    typeof value.amount === "number" &&
    "pixQrCode" in value &&
    (typeof value.pixQrCode === "string" || value.pixQrCode === null) &&
    "pixQrCodeBase64" in value &&
    (typeof value.pixQrCodeBase64 === "string" ||
      value.pixQrCodeBase64 === null) &&
    "pixExpiresAt" in value &&
    typeof value.pixExpiresAt === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

export function createPendingCheckoutStorage(store: PendingCheckoutStore) {
  const savePendingCheckout = async (
    snapshot: PendingCheckoutSnapshot,
  ): Promise<void> => {
    try {
      await store.setItemAsync(
        PENDING_CHECKOUT_KEY,
        JSON.stringify(snapshot),
      );
    } catch {
      // Ignore local persistence issues so the payment flow keeps working.
    }
  };

  const clearPendingCheckout = async (): Promise<void> => {
    try {
      await store.deleteItemAsync(PENDING_CHECKOUT_KEY);
    } catch {
      // Ignore cleanup failures from local storage.
    }
  };

  const getPendingCheckout = async (): Promise<PendingCheckoutSnapshot | null> => {
    let storedValue: string | null = null;

    try {
      storedValue = await store.getItemAsync(PENDING_CHECKOUT_KEY);
    } catch {
      return null;
    }

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue);

      if (isPendingCheckoutSnapshot(parsedValue)) {
        return parsedValue;
      }
    } catch {
      // Ignore malformed local payloads and clear below.
    }

    await clearPendingCheckout();
    return null;
  };

  const getPendingCheckoutById = async (
    paymentId: string | null | undefined,
  ): Promise<PendingCheckoutSnapshot | null> => {
    const snapshot = await getPendingCheckout();

    if (!snapshot || !paymentId || snapshot.paymentId !== paymentId) {
      return null;
    }

    return snapshot;
  };

  return {
    savePendingCheckout,
    getPendingCheckout,
    getPendingCheckoutById,
    clearPendingCheckout,
  };
}

const secureStoreAdapter: PendingCheckoutStore = {
  setItemAsync: async (key, value) => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key) => {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(key);
  },
  deleteItemAsync: async (key) => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  },
};

const pendingCheckoutStorage = createPendingCheckoutStorage(secureStoreAdapter);

export const savePendingCheckout = pendingCheckoutStorage.savePendingCheckout;
export const getPendingCheckout = pendingCheckoutStorage.getPendingCheckout;
export const getPendingCheckoutById =
  pendingCheckoutStorage.getPendingCheckoutById;
export const clearPendingCheckout = pendingCheckoutStorage.clearPendingCheckout;

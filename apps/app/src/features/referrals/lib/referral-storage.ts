const REFERRAL_REMINDER_PREFIX = "referral.reminder.";
const REFERRAL_PIX_KEY_PREFIX = "referral.pix-key.";
const REFERRAL_PROMPT_SEEN_PREFIX = "referral.prompt-seen.";
const FIRST_REFERRAL_REMINDER_DELAY_DAYS = 7;

export interface ReferralReminderSnapshot {
  nextPromptAt: string;
  lastPromptAt: string | null;
}

interface ReferralStorageStore {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getReminderKey(userId: string): string {
  return `${REFERRAL_REMINDER_PREFIX}${userId}`;
}

function getPixKeyKey(userId: string): string {
  return `${REFERRAL_PIX_KEY_PREFIX}${userId}`;
}

function getPromptSeenKey(userId: string): string {
  return `${REFERRAL_PROMPT_SEEN_PREFIX}${userId}`;
}

export function getDefaultReferralReminderSnapshot(
  now = new Date(),
): ReferralReminderSnapshot {
  return {
    nextPromptAt: addDays(now, FIRST_REFERRAL_REMINDER_DELAY_DAYS).toISOString(),
    lastPromptAt: null,
  };
}

export function isReferralReminderSnapshot(
  value: unknown,
): value is ReferralReminderSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "nextPromptAt" in value &&
    typeof value.nextPromptAt === "string" &&
    "lastPromptAt" in value &&
    (typeof value.lastPromptAt === "string" || value.lastPromptAt === null)
  );
}

export function shouldShowReferralReminder(
  snapshot: ReferralReminderSnapshot,
  now = new Date(),
): boolean {
  return new Date(snapshot.nextPromptAt).getTime() <= now.getTime();
}

export function buildDeferredReferralReminderSnapshot(
  delayDays: number,
  now = new Date(),
): ReferralReminderSnapshot {
  return {
    nextPromptAt: addDays(now, delayDays).toISOString(),
    lastPromptAt: now.toISOString(),
  };
}

export function createReferralStorage(store: ReferralStorageStore) {
  const getReminderSnapshot = async (
    userId: string | null | undefined,
  ): Promise<ReferralReminderSnapshot | null> => {
    if (!userId) {
      return null;
    }

    try {
      const rawValue = await store.getItemAsync(getReminderKey(userId));

      if (!rawValue) {
        return getDefaultReferralReminderSnapshot();
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      if (isReferralReminderSnapshot(parsedValue)) {
        return parsedValue;
      }
    } catch {
      return getDefaultReferralReminderSnapshot();
    }

    return getDefaultReferralReminderSnapshot();
  };

  const saveReminderSnapshot = async (
    userId: string | null | undefined,
    snapshot: ReferralReminderSnapshot,
  ): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await store.setItemAsync(getReminderKey(userId), JSON.stringify(snapshot));
    } catch {
      // Ignore local reminder persistence failures.
    }
  };

  const getPixKey = async (
    userId: string | null | undefined,
  ): Promise<string | null> => {
    if (!userId) {
      return null;
    }

    try {
      return await store.getItemAsync(getPixKeyKey(userId));
    } catch {
      return null;
    }
  };

  const savePixKey = async (
    userId: string | null | undefined,
    pixKey: string,
  ): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await store.setItemAsync(getPixKeyKey(userId), pixKey);
    } catch {
      // Ignore local PIX persistence failures.
    }
  };

  const clearPixKey = async (
    userId: string | null | undefined,
  ): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await store.deleteItemAsync(getPixKeyKey(userId));
    } catch {
      // Ignore local PIX cleanup failures.
    }
  };

  const getHasSeenPrompt = async (
    userId: string | null | undefined,
  ): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    try {
      return (await store.getItemAsync(getPromptSeenKey(userId))) === "1";
    } catch {
      return false;
    }
  };

  const markPromptSeen = async (
    userId: string | null | undefined,
  ): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await store.setItemAsync(getPromptSeenKey(userId), "1");
    } catch {
      // Ignore local prompt state persistence failures.
    }
  };

  const clearPromptSeen = async (
    userId: string | null | undefined,
  ): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      await store.deleteItemAsync(getPromptSeenKey(userId));
    } catch {
      // Ignore local prompt cleanup failures.
    }
  };

  return {
    getReminderSnapshot,
    saveReminderSnapshot,
    getPixKey,
    savePixKey,
    clearPixKey,
    getHasSeenPrompt,
    markPromptSeen,
    clearPromptSeen,
  };
}

const secureStoreAdapter: ReferralStorageStore = {
  getItemAsync: async (key) => {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: async (key, value) => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  },
  deleteItemAsync: async (key) => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  },
};

const referralStorage = createReferralStorage(secureStoreAdapter);

export const getReferralReminderSnapshot = referralStorage.getReminderSnapshot;
export const saveReferralReminderSnapshot = referralStorage.saveReminderSnapshot;
export const getReferralPixKey = referralStorage.getPixKey;
export const saveReferralPixKey = referralStorage.savePixKey;
export const clearReferralPixKey = referralStorage.clearPixKey;
export const getHasSeenReferralPrompt = referralStorage.getHasSeenPrompt;
export const markReferralPromptSeen = referralStorage.markPromptSeen;
export const clearReferralPromptSeen = referralStorage.clearPromptSeen;

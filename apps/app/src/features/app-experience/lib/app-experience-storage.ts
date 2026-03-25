import { getDefaultReviewSnapshot, type ReviewSnapshot } from "./review-policy";

const APP_EXPERIENCE_STORAGE_KEY = "app.experience.snapshot";

export interface AppExperienceSnapshot {
  review: ReviewSnapshot;
  updates: {
    lastDismissedVersion: string | null;
    lastDismissedAt: string | null;
  };
}

export interface AppExperienceStore {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
}

export function getDefaultAppExperienceSnapshot(): AppExperienceSnapshot {
  return {
    review: getDefaultReviewSnapshot(),
    updates: {
      lastDismissedVersion: null,
      lastDismissedAt: null,
    },
  };
}

export function isAppExperienceSnapshot(
  value: unknown,
): value is AppExperienceSnapshot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AppExperienceSnapshot>;

  return (
    typeof candidate.review === "object" &&
    candidate.review !== null &&
    typeof candidate.review.successfulAppointmentCount === "number" &&
    Array.isArray(candidate.review.promptHistory) &&
    typeof candidate.updates === "object" &&
    candidate.updates !== null &&
    "lastDismissedVersion" in candidate.updates &&
    "lastDismissedAt" in candidate.updates
  );
}

function normalizeAppExperienceSnapshot(
  value: unknown,
): AppExperienceSnapshot | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<AppExperienceSnapshot>;
  const defaultSnapshot = getDefaultAppExperienceSnapshot();

  if (
    typeof candidate.review !== "object" ||
    candidate.review === null ||
    typeof candidate.review.successfulAppointmentCount !== "number" ||
    !Array.isArray(candidate.review.promptHistory)
  ) {
    return null;
  }

  return {
    review: {
      ...defaultSnapshot.review,
      ...candidate.review,
    },
    updates: {
      ...defaultSnapshot.updates,
      ...(typeof candidate.updates === "object" && candidate.updates !== null
        ? candidate.updates
        : {}),
    },
  };
}

export function createAppExperienceStorage(store: AppExperienceStore) {
  const getSnapshot = async (): Promise<AppExperienceSnapshot> => {
    try {
      const rawValue = await store.getItemAsync(APP_EXPERIENCE_STORAGE_KEY);

      if (!rawValue) {
        return getDefaultAppExperienceSnapshot();
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      const normalizedValue = normalizeAppExperienceSnapshot(parsedValue);

      if (normalizedValue) {
        return normalizedValue;
      }
    } catch {
      return getDefaultAppExperienceSnapshot();
    }

    return getDefaultAppExperienceSnapshot();
  };

  const saveSnapshot = async (
    snapshot: AppExperienceSnapshot,
  ): Promise<void> => {
    try {
      await store.setItemAsync(
        APP_EXPERIENCE_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch {
      // Ignore local persistence failures to keep the app responsive.
    }
  };

  return {
    getSnapshot,
    saveSnapshot,
  };
}

const secureStoreAdapter: AppExperienceStore = {
  setItemAsync: async (key, value) => {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key) => {
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(key);
  },
};

const appExperienceStorage = createAppExperienceStorage(secureStoreAdapter);

export const getAppExperienceSnapshot = appExperienceStorage.getSnapshot;
export const saveAppExperienceSnapshot = appExperienceStorage.saveSnapshot;

import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import * as Updates from "expo-updates";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Linking, Platform } from "react-native";
import { toast } from "sonner-native";
import { ReviewReminderModal } from "../components/review-reminder-modal";
import { StoreUpdateModal } from "../components/store-update-modal";
import {
  getAppExperienceSnapshot,
  getDefaultAppExperienceSnapshot,
  saveAppExperienceSnapshot,
  type AppExperienceSnapshot,
} from "./app-experience-storage";
import {
  DEFAULT_REVIEW_POLICY,
  deferReviewPrompt,
  ensureFirstOpen,
  incrementSuccessfulAppointments,
  markReviewPromptShown,
  markStoreReviewOpened,
  shouldPromptForReview,
} from "./review-policy";
import {
  createInAppUpdatesClient,
  IMMEDIATE_IN_APP_UPDATE,
  type InAppUpdatesClient,
} from "./in-app-updates";
import { resolveStoreUpdate } from "./version-utils";

interface AppExperienceContextValue {
  currentVersion: string | null;
  hasStoreUpdate: boolean;
  isCheckingForUpdates: boolean;
  checkForUpdates: (showFeedback?: boolean) => Promise<void>;
  openStoreUpdate: () => Promise<void>;
  openStoreReview: () => Promise<void>;
  deferReview: () => Promise<void>;
  registerSuccessfulAppointment: () => Promise<void>;
}

const AppExperienceContext = createContext<AppExperienceContextValue | null>(
  null,
);

interface StoreUpdateState {
  currentVersion: string | null;
  latestVersion: string | null;
  storeUrl: string | null;
  isAvailable: boolean;
  canUseAndroidImmediate: boolean;
}

const DEFAULT_STORE_UPDATE_STATE: StoreUpdateState = {
  currentVersion: null,
  latestVersion: null,
  storeUrl: null,
  isAvailable: false,
  canUseAndroidImmediate: false,
};

function getCurrentAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}

function getDefaultStoreUpdateUrl(): string | null {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.appStoreUrl ?? null;
  }

  if (Platform.OS === "android") {
    return Constants.expoConfig?.android?.playStoreUrl ?? null;
  }

  return null;
}

function getStoreReviewUrl(): string | null {
  const baseUrl = StoreReview.storeUrl();

  if (!baseUrl) {
    return null;
  }

  if (Platform.OS === "ios" && !baseUrl.includes("action=write-review")) {
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}action=write-review`;
  }

  return baseUrl;
}

function getPreferredStoreOpenUrl(url: string | null): string | null {
  if (Platform.OS !== "ios" || !url || !url.startsWith("https://")) {
    return url;
  }

  return url.replace("https://", "itms-apps://");
}

export function AppExperienceProvider({ children }: { children: ReactNode }) {
  const platform = Platform.OS;
  const isNativeMobile = platform === "ios" || platform === "android";
  const [storeUpdateState, setStoreUpdateState] = useState<StoreUpdateState>(
    () => ({
      ...DEFAULT_STORE_UPDATE_STATE,
      currentVersion: getCurrentAppVersion(),
    }),
  );
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isReviewReminderVisible, setIsReviewReminderVisible] = useState(false);
  const [, setSnapshot] = useState<AppExperienceSnapshot>(
    getDefaultAppExperienceSnapshot(),
  );
  const snapshotRef = useRef(getDefaultAppExperienceSnapshot());
  const inAppUpdatesRef = useRef<InAppUpdatesClient | null>(null);

  const persistSnapshot = useCallback((nextSnapshot: AppExperienceSnapshot) => {
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    void saveAppExperienceSnapshot(nextSnapshot);
  }, []);

  const getInAppUpdatesClient = useCallback((): InAppUpdatesClient | null => {
    if (!isNativeMobile) {
      return null;
    }

    if (!inAppUpdatesRef.current) {
      inAppUpdatesRef.current = createInAppUpdatesClient(__DEV__);
    }

    return inAppUpdatesRef.current;
  }, [isNativeMobile]);

  const syncOtaUpdate = useCallback(async (): Promise<boolean> => {
    if (!isNativeMobile || !Updates.isEnabled) {
      return false;
    }

    try {
      const result = await Updates.checkForUpdateAsync();

      if (!result.isAvailable) {
        return false;
      }

      await Updates.fetchUpdateAsync();
      return true;
    } catch {
      return false;
    }
  }, [isNativeMobile]);

  const syncStoreUpdateState = useCallback(
    async (showFeedback = false): Promise<void> => {
      if (!isNativeMobile) {
        return;
      }

      setIsCheckingForUpdates(true);

      try {
        const inAppUpdates = getInAppUpdatesClient();
        const otaDownloadPromise = syncOtaUpdate();
        const storeUpdateResult =
          (await inAppUpdates?.checkNeedsUpdate(
            platform === "android"
              ? {
                  // On Android the Play Core availability is the source of truth.
                  customVersionComparator: () => 1,
                }
              : {
                  curVersion: getCurrentAppVersion() ?? undefined,
                },
          )) ?? null;

        const currentVersion = getCurrentAppVersion();
        const updateResolution = resolveStoreUpdate({
          platform,
          checkResult: storeUpdateResult,
          fallbackStoreUrl: getDefaultStoreUpdateUrl(),
        });
        const hasStoreUpdate = updateResolution.shouldPrompt;

        setStoreUpdateState({
          currentVersion,
          latestVersion: updateResolution.latestVersion,
          storeUrl: updateResolution.storeUrl,
          isAvailable: hasStoreUpdate,
          canUseAndroidImmediate: updateResolution.canUseAndroidImmediate,
        });

        if (hasStoreUpdate) {
          setIsReviewReminderVisible(false);
        }

        if (showFeedback) {
          if (hasStoreUpdate) {
            return;
          }

          const otaDownloaded = await otaDownloadPromise;

          if (otaDownloaded) {
            toast.success(
              "Atualização em segundo plano baixada. Reabra o app para usar a nova versão.",
            );
            return;
          }

          toast.success("Você já está na versão mais recente.");
        }
      } catch {
        if (showFeedback) {
          toast.error("Não foi possível verificar atualizações agora.");
        }
      } finally {
        setIsCheckingForUpdates(false);
      }
    },
    [getInAppUpdatesClient, isNativeMobile, platform, syncOtaUpdate],
  );

  const openUrl = useCallback(async (url: string | null): Promise<boolean> => {
    if (!url) {
      return false;
    }

    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  }, []);

  const openStoreUpdate = useCallback(async (): Promise<void> => {
    if (!storeUpdateState.isAvailable) {
      return;
    }

    if (platform === "android" && storeUpdateState.canUseAndroidImmediate) {
      try {
        const inAppUpdates = getInAppUpdatesClient();

        if (!inAppUpdates) {
          throw new Error("in-app updates indisponivel");
        }

        await inAppUpdates.startUpdate({
          updateType: IMMEDIATE_IN_APP_UPDATE,
        });
        return;
      } catch {
        const didOpenFallbackStore = await openUrl(
          storeUpdateState.storeUrl ?? getDefaultStoreUpdateUrl(),
        );

        if (didOpenFallbackStore) {
          return;
        }
      }
    }

    const storeUrl = storeUpdateState.storeUrl ?? getDefaultStoreUpdateUrl();
    const didOpenStore =
      (await openUrl(getPreferredStoreOpenUrl(storeUrl))) ||
      (await openUrl(storeUrl));

    if (!didOpenStore) {
      toast.error("Não foi possível abrir a loja do aplicativo.");
    }
  }, [
    getInAppUpdatesClient,
    openUrl,
    platform,
    storeUpdateState.canUseAndroidImmediate,
    storeUpdateState.isAvailable,
    storeUpdateState.storeUrl,
  ]);

  const openStoreReview = useCallback(async (): Promise<void> => {
    const reviewUrl = getStoreReviewUrl();

    if (await openUrl(reviewUrl)) {
      persistSnapshot({
        ...snapshotRef.current,
        review: markStoreReviewOpened(snapshotRef.current.review),
      });
      setIsReviewReminderVisible(false);
      return;
    }

    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      persistSnapshot({
        ...snapshotRef.current,
        review: markStoreReviewOpened(snapshotRef.current.review),
      });
      setIsReviewReminderVisible(false);
      return;
    }

    toast.error("Não foi possível abrir a avaliação do aplicativo.");
  }, [openUrl, persistSnapshot]);

  const deferReview = useCallback(async (): Promise<void> => {
    const nextSnapshot: AppExperienceSnapshot = {
      ...snapshotRef.current,
      review: deferReviewPrompt(
        snapshotRef.current.review,
        DEFAULT_REVIEW_POLICY,
      ),
    };

    persistSnapshot(nextSnapshot);
    setIsReviewReminderVisible(false);
  }, [persistSnapshot]);

  const registerSuccessfulAppointment = useCallback(async (): Promise<void> => {
    const now = new Date();
    const baseReviewSnapshot = ensureFirstOpen(snapshotRef.current.review, now);
    const nextReviewSnapshot =
      incrementSuccessfulAppointments(baseReviewSnapshot);
    const nextSnapshot: AppExperienceSnapshot = {
      ...snapshotRef.current,
      review: nextReviewSnapshot,
    };

    persistSnapshot(nextSnapshot);

    if (
      storeUpdateState.isAvailable ||
      !shouldPromptForReview(nextReviewSnapshot, DEFAULT_REVIEW_POLICY, now)
    ) {
      return;
    }

    const promptedSnapshot: AppExperienceSnapshot = {
      ...nextSnapshot,
      review: markReviewPromptShown(nextReviewSnapshot, now),
    };

    persistSnapshot(promptedSnapshot);
    setIsReviewReminderVisible(true);
  }, [persistSnapshot, storeUpdateState.isAvailable]);

  useEffect(() => {
    if (!isNativeMobile) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      const storedSnapshot = await getAppExperienceSnapshot();
      const normalizedSnapshot: AppExperienceSnapshot = {
        ...storedSnapshot,
        review: ensureFirstOpen(storedSnapshot.review),
      };

      if (isCancelled) {
        return;
      }

      persistSnapshot(normalizedSnapshot);
      await syncStoreUpdateState();
    })();

    return () => {
      isCancelled = true;
    };
  }, [isNativeMobile, persistSnapshot, syncStoreUpdateState]);

  useEffect(() => {
    if (!isNativeMobile) {
      return;
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncStoreUpdateState();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isNativeMobile, syncStoreUpdateState]);

  const value = useMemo<AppExperienceContextValue>(
    () => ({
      currentVersion: storeUpdateState.currentVersion,
      hasStoreUpdate: storeUpdateState.isAvailable,
      isCheckingForUpdates,
      checkForUpdates: syncStoreUpdateState,
      openStoreUpdate,
      openStoreReview,
      deferReview,
      registerSuccessfulAppointment,
    }),
    [
      deferReview,
      isCheckingForUpdates,
      openStoreReview,
      openStoreUpdate,
      registerSuccessfulAppointment,
      storeUpdateState.currentVersion,
      storeUpdateState.isAvailable,
      syncStoreUpdateState,
    ],
  );

  return (
    <AppExperienceContext.Provider value={value}>
      {children}

      <StoreUpdateModal
        visible={storeUpdateState.isAvailable}
        currentVersion={storeUpdateState.currentVersion}
        latestVersion={storeUpdateState.latestVersion}
        platform={platform === "android" ? "android" : "ios"}
        onUpdate={() => {
          void openStoreUpdate();
        }}
      />

      <ReviewReminderModal
        visible={isReviewReminderVisible}
        onReviewNow={() => {
          void openStoreReview();
        }}
        onReviewLater={() => {
          void deferReview();
        }}
      />
    </AppExperienceContext.Provider>
  );
}

export function useAppExperience() {
  const context = useContext(AppExperienceContext);

  if (!context) {
    throw new Error(
      "useAppExperience must be used within AppExperienceProvider",
    );
  }

  return context;
}

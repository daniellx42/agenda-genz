export interface InAppUpdatesCheckOptions {
  curVersion?: string;
  country?: string;
  customVersionComparator?: () => -1 | 0 | 1;
}

export interface InAppUpdatesAndroidMetadata {
  isImmediateUpdateAllowed?: boolean;
}

export interface InAppUpdatesIosMetadata {
  trackViewUrl?: string;
}

export interface InAppUpdatesCheckResult {
  shouldUpdate: boolean;
  storeVersion: string;
  reason: string;
  other?: InAppUpdatesAndroidMetadata | InAppUpdatesIosMetadata;
}

export type InAppUpdatesStartOptions =
  | { updateType: number }
  | {
      forceUpgrade?: boolean;
      title?: string;
      message?: string;
      buttonUpgradeText?: string;
      buttonCancelText?: string;
      country?: string;
    };

export interface InAppUpdatesClient {
  checkNeedsUpdate: (
    checkOptions?: InAppUpdatesCheckOptions,
  ) => Promise<InAppUpdatesCheckResult>;
  startUpdate: (updateOptions: InAppUpdatesStartOptions) => Promise<void>;
}

export const IMMEDIATE_IN_APP_UPDATE = 1;

export function createInAppUpdatesClient(
  _isDebug: boolean,
): InAppUpdatesClient | null {
  return null;
}

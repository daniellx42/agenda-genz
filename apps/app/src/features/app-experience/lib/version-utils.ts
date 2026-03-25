import type { InAppUpdatesCheckResult } from "./in-app-updates";

export interface StoreUpdateResolutionInput {
  platform: "ios" | "android";
  checkResult: InAppUpdatesCheckResult | null;
  fallbackStoreUrl: string | null;
}

export interface StoreUpdateResolution {
  shouldPrompt: boolean;
  latestVersion: string | null;
  storeUrl: string | null;
  canUseAndroidImmediate: boolean;
}

export function resolveStoreUpdate(
  input: StoreUpdateResolutionInput,
): StoreUpdateResolution {
  const { checkResult, fallbackStoreUrl, platform } = input;

  if (!checkResult?.shouldUpdate || !checkResult.storeVersion) {
    return {
      shouldPrompt: false,
      latestVersion: null,
      storeUrl: null,
      canUseAndroidImmediate: false,
    };
  }

  const canUseAndroidImmediate =
    platform === "android" &&
    hasBooleanProperty(checkResult.other, "isImmediateUpdateAllowed")
      ? checkResult.other.isImmediateUpdateAllowed
      : false;
  const storeUrl =
    platform === "ios" && hasStringProperty(checkResult.other, "trackViewUrl")
      ? checkResult.other.trackViewUrl
      : fallbackStoreUrl;

  return {
    shouldPrompt: true,
    latestVersion: checkResult.storeVersion,
    storeUrl,
    canUseAndroidImmediate,
  };
}

function hasBooleanProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is Record<Key, boolean> {
  const candidate = value as Record<string, unknown> | null;

  return (
    candidate !== null &&
    typeof candidate === "object" &&
    typeof candidate[key] === "boolean"
  );
}

function hasStringProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is Record<Key, string> {
  const candidate = value as Record<string, unknown> | null;

  return (
    candidate !== null &&
    typeof candidate === "object" &&
    typeof candidate[key] === "string"
  );
}

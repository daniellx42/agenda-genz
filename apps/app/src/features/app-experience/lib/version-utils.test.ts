import { describe, expect, it } from "bun:test";
import { resolveStoreUpdate } from "./version-utils";

describe("resolveStoreUpdate", () => {
  it("retorna prompt para o Android e informa quando o update imediato esta liberado", () => {
    const result = resolveStoreUpdate({
      platform: "android",
      fallbackStoreUrl: "https://play.google.com/store/apps/details?id=com.app",
      checkResult: {
        shouldUpdate: true,
        storeVersion: "1.4.0",
        reason: "store-version-newer",
        other: {
          isImmediateUpdateAllowed: true,
        },
      },
    });

    expect(result).toEqual({
      shouldPrompt: true,
      latestVersion: "1.4.0",
      storeUrl: "https://play.google.com/store/apps/details?id=com.app",
      canUseAndroidImmediate: true,
    });
  });

  it("prefere a url retornada pela App Store no iPhone", () => {
    const result = resolveStoreUpdate({
      platform: "ios",
      fallbackStoreUrl: "https://apps.apple.com/app/id123",
      checkResult: {
        shouldUpdate: true,
        storeVersion: "1.1.0",
        reason: "store-version-newer",
        other: {
          trackViewUrl: "https://apps.apple.com/br/app/id123",
        },
      },
    });

    expect(result).toEqual({
      shouldPrompt: true,
      latestVersion: "1.1.0",
      storeUrl: "https://apps.apple.com/br/app/id123",
      canUseAndroidImmediate: false,
    });
  });

  it("nao mostra modal quando nao existe update", () => {
    const result = resolveStoreUpdate({
      platform: "ios",
      fallbackStoreUrl: "https://apps.apple.com/app/id123",
      checkResult: {
        shouldUpdate: false,
        storeVersion: "1.0.0",
        reason: "up-to-date",
        other: {},
      },
    });

    expect(result).toEqual({
      shouldPrompt: false,
      latestVersion: null,
      storeUrl: null,
      canUseAndroidImmediate: false,
    });
  });
});

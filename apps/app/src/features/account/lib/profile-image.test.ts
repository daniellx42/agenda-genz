import { describe, expect, it } from "bun:test";
import {
  buildSettingsProfileImageState,
  getStoredProfileImageKey,
  isExternalImageUrl,
  isOwnedProfileImageKey,
} from "./profile-image";

describe("profile-image", () => {
  it("reconhece urls externas como Google ou Apple", () => {
    expect(isExternalImageUrl("https://lh3.googleusercontent.com/avatar")).toBe(
      true,
    );
    expect(isExternalImageUrl("profile/user-1/avatar.png")).toBe(false);
  });

  it("reconhece apenas keys próprias do usuário como imagem do R2", () => {
    expect(isOwnedProfileImageKey("user-1", "profile/user-1/avatar.png")).toBe(
      true,
    );
    expect(isOwnedProfileImageKey("user-1", "profile/user-2/avatar.png")).toBe(
      false,
    );
  });

  it("resolve o estado visual para imagem externa", () => {
    expect(
      buildSettingsProfileImageState({
        userId: "user-1",
        imageValue: "https://appleid.cdn/avatar.png",
        resolvedStoredImageUrl: null,
        resolvedStoredImageCacheKey: null,
      }),
    ).toEqual({
      storedProfileImageKey: null,
      displayedProfileImageUrl: "https://appleid.cdn/avatar.png",
      displayedProfileImageCacheKey: null,
      isLoadingStoredProfileImage: false,
    });
  });

  it("resolve o estado visual para imagem própria assinada", () => {
    expect(
      buildSettingsProfileImageState({
        userId: "user-1",
        imageValue: "profile/user-1/avatar.png",
        resolvedStoredImageUrl: "https://signed.example/avatar.png",
        resolvedStoredImageCacheKey: "profile/user-1/avatar.png",
      }),
    ).toEqual({
      storedProfileImageKey: "profile/user-1/avatar.png",
      displayedProfileImageUrl: "https://signed.example/avatar.png",
      displayedProfileImageCacheKey: "profile/user-1/avatar.png",
      isLoadingStoredProfileImage: false,
    });
  });

  it("marca loading quando a key própria ainda não foi resolvida", () => {
    expect(
      buildSettingsProfileImageState({
        userId: "user-1",
        imageValue: getStoredProfileImageKey("user-1", "profile/user-1/avatar.png"),
        resolvedStoredImageUrl: null,
        resolvedStoredImageCacheKey: null,
      }).isLoadingStoredProfileImage,
    ).toBe(true);
  });
});

import {
  deleteAccount,
  deleteProfileImageObject,
} from "../api/account-mutations";
import {
  buildSettingsProfileImageState,
  isOwnedProfileImageKey,
} from "../lib/profile-image";
import {
  canDeleteAccountWithConfirmation,
  canSaveDisplayName,
  getTrimmedDisplayName,
} from "../lib/settings-form";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useSubscriptionStore } from "@/features/billing/store/subscription-store";
import { uploadImageToR2 } from "@/features/clients/lib/client-image";
import { useApiError } from "@/hooks/use-api-error";
import { useSquareImagePicker } from "@/hooks/use-square-image-picker";
import { authClient } from "@/lib/auth-client";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner-native";
import type { ImagePickerAsset } from "expo-image-picker";

export function useSettingsController() {
  const { session } = useAuthSession();
  const { refetch: refetchSession } = authClient.useSession();
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const imagePicker = useSquareImagePicker();
  const [displayName, setDisplayName] = useState(session?.user.name ?? "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [profileImageAsset, setProfileImageAsset] =
    useState<ImagePickerAsset | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const currentUserId = session?.user.id ?? null;
  const currentImageValue = session?.user.image ?? null;
  const currentStoredProfileImageKey = isOwnedProfileImageKey(
    currentUserId,
    currentImageValue,
  )
    ? currentImageValue
    : null;

  const { imageUrl: storedProfileImageUrl, imageCacheKey: storedProfileImageCacheKey } =
    useResolvedImage({
      imageKey: currentStoredProfileImageKey,
      enabled: Boolean(currentStoredProfileImageKey),
      handleError: showError,
    });

  useEffect(() => {
    setDisplayName(session?.user.name ?? "");
  }, [session?.user.name]);

  const trimmedDisplayName = useMemo(
    () => getTrimmedDisplayName(displayName),
    [displayName],
  );
  const canSaveName = canSaveDisplayName(displayName, session?.user.name);
  const canDeleteAccount = canDeleteAccountWithConfirmation(deleteConfirmation);

  const profileImageState = buildSettingsProfileImageState({
    userId: currentUserId,
    imageValue: currentImageValue,
    resolvedStoredImageUrl: storedProfileImageUrl ?? null,
    resolvedStoredImageCacheKey: storedProfileImageCacheKey ?? null,
    hasLocalImage: Boolean(profileImageAsset),
  });

  const resetSessionState = useCallback(async () => {
    await queryClient.cancelQueries();
    useSubscriptionStore.getState().setPlanExpiresAt(null);
    await refetchSession();
  }, [queryClient, refetchSession]);

  const cleanupOwnedProfileImage = useCallback(
    async (imageKey: string | null | undefined) => {
      if (!isOwnedProfileImageKey(currentUserId, imageKey)) {
        return;
      }

      await deleteProfileImageObject(imageKey).catch(() => undefined);
    },
    [currentUserId],
  );

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await authClient.updateUser({ name });

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: async () => {
      toast.success("Nome atualizado!");
      await refetchSession();
    },
    onError: showError,
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: async () => {
      await resetSessionState();
    },
    onError: showError,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => deleteAccount(),
    onSuccess: async () => {
      toast.success("Conta deletada com sucesso");
      setDeleteConfirmation("");
      await resetSessionState();
    },
    onError: showError,
  });

  const selectImageSource = useCallback(
    async (source: "camera" | "gallery") => {
      if (!session) return;

      const asset = await imagePicker.pickSquareImage(source, {
        title: "Ajustar foto de perfil",
        description:
          "Enquadre a foto para o perfil ficar bonito e consistente no aplicativo.",
        confirmLabel: "Usar foto",
        quality: 0.8,
      });

      if (!asset) return;

      const previousImage = session.user.image ?? null;

      setProfileImageAsset(asset);
      setUploadingPhoto(true);

      try {
        const nextImageKey = await uploadImageToR2(
          {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
          },
          "profile",
          showError,
        );

        if (!nextImageKey) {
          setProfileImageAsset(null);
          return;
        }

        const result = await authClient.updateUser({ image: nextImageKey });

        if (result.error) {
          await deleteProfileImageObject(nextImageKey).catch(() => undefined);
          throw result.error;
        }

        await cleanupOwnedProfileImage(previousImage);
        await refetchSession();
        setProfileImageAsset(null);
        toast.success("Foto atualizada!");
      } catch (error) {
        setProfileImageAsset(null);
        showError(error);
      } finally {
        setUploadingPhoto(false);
      }
    },
    [cleanupOwnedProfileImage, imagePicker, refetchSession, session, showError],
  );

  const deleteProfileImage = useCallback(async () => {
    if (!session?.user.image || uploadingPhoto || deletingPhoto) return;

    const previousImage = session.user.image;

    setDeletingPhoto(true);
    try {
      const result = await authClient.updateUser({ image: null });

      if (result.error) {
        throw result.error;
      }

      await cleanupOwnedProfileImage(previousImage);
      setProfileImageAsset(null);
      await refetchSession();
      toast.success("Foto removida");
    } catch (error) {
      showError(error);
    } finally {
      setDeletingPhoto(false);
    }
  }, [
    cleanupOwnedProfileImage,
    deletingPhoto,
    refetchSession,
    session,
    showError,
    uploadingPhoto,
  ]);

  const resetDisplayName = useCallback(() => {
    setDisplayName(session?.user.name ?? "");
  }, [session?.user.name]);

  const resetDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation("");
  }, []);

  const clearLocalProfileImage = useCallback(() => {
    setProfileImageAsset(null);
  }, []);

  return {
    session,
    displayName,
    setDisplayName,
    deleteConfirmation,
    setDeleteConfirmation,
    trimmedDisplayName,
    canSaveName,
    canDeleteAccount,
    profileImage: {
      imageUrl: profileImageState.displayedProfileImageUrl,
      imageCacheKey: profileImageState.displayedProfileImageCacheKey,
      localUri: profileImageAsset?.uri ?? null,
      uploading: uploadingPhoto || profileImageState.isLoadingStoredProfileImage,
      deleting: deletingPhoto,
      isBusy:
        uploadingPhoto ||
        deletingPhoto ||
        profileImageState.isLoadingStoredProfileImage,
    },
    cropperProps: imagePicker.cropperProps,
    updateNameMutation,
    signOutMutation,
    deleteAccountMutation,
    selectImageSource,
    deleteProfileImage,
    clearLocalProfileImage,
    resetDisplayName,
    resetDeleteConfirmation,
  };
}

import {
  deleteAppointmentImage,
  updateAppointmentImage,
} from "../api/appointment-mutations";
import { appointmentKeys } from "../api/appointment-query-options";
import {
  pickSquareImage,
} from "../lib/appointment-images";
import {
  deleteClientProfileImage,
  updateClientProfileImage,
} from "@/features/clients/api/client-mutations";
import {
  imageUrlQueryOptions,
} from "@/lib/api/upload-query-options";
import { uploadImageAsset } from "@/lib/api/image-upload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner-native";
import type { ImagePickerAsset } from "expo-image-picker";
import type { ImageSlot } from "../lib/appointment-images";

interface AppointmentDetailMediaParams {
  appointmentId: string | undefined;
  appointment:
    | {
        beforeImageKey: string | null;
        afterImageKey: string | null;
        client: {
          id: string;
          profileImageKey: string | null;
        };
      }
    | null
    | undefined;
  showError: (error: unknown) => void;
}

export function useAppointmentDetailMedia({
  appointmentId,
  appointment,
  showError,
}: AppointmentDetailMediaParams) {
  const queryClient = useQueryClient();
  const [uploadingSlot, setUploadingSlot] = useState<ImageSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<ImageSlot | null>(null);
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<ImageSlot | null>(
    null,
  );
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [deletingProfileImage, setDeletingProfileImage] = useState(false);
  const [pendingDeleteProfileImage, setPendingDeleteProfileImage] =
    useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [viewerLabel, setViewerLabel] = useState("");

  const { data: beforeImageUrl } = useQuery(
    imageUrlQueryOptions(appointment?.beforeImageKey, showError),
  );
  const { data: afterImageUrl } = useQuery(
    imageUrlQueryOptions(appointment?.afterImageKey, showError),
  );
  const { data: profileImageUrl } = useQuery(
    imageUrlQueryOptions(appointment?.client.profileImageKey, showError),
  );

  const invalidateAppointments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
  }, [queryClient]);

  const uploadAssetToFolder = useCallback(
    async (
      asset: ImagePickerAsset,
      folder: "profile" | "services",
    ): Promise<string | null> => {
      const uploadedKey = await uploadImageAsset(
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
        folder,
        showError,
      );

      return uploadedKey ?? null;
    },
    [showError],
  );

  const uploadWorkImageFromSource = useCallback(
    async (slot: ImageSlot, source: "camera" | "gallery") => {
      if (!appointmentId) return;

      const asset = await pickSquareImage(source);
      if (!asset) return;

      setUploadingSlot(slot);
      try {
        const imageKey = await uploadAssetToFolder(asset, "services");
        if (!imageKey) return;

        await updateAppointmentImage({
          id: appointmentId,
          imageField: slot === "before" ? "beforeImageKey" : "afterImageKey",
          imageKey,
        });

        await invalidateAppointments();
        toast.success(
          slot === "before"
            ? "Foto 'Antes' enviada!"
            : "Foto 'Depois' enviada!",
        );
      } catch (error) {
        showError(error);
        toast.error("Erro ao enviar imagem. Tente novamente.");
      } finally {
        setUploadingSlot(null);
      }
    },
    [appointmentId, invalidateAppointments, showError, uploadAssetToFolder],
  );

  const requestDeleteImage = useCallback((slot: ImageSlot) => {
    setPendingDeleteSlot(slot);
  }, []);

  const clearPendingDeleteImage = useCallback(() => {
    setPendingDeleteSlot(null);
  }, []);

  const confirmDeleteImage = useCallback(async (): Promise<boolean> => {
    if (!appointmentId || !pendingDeleteSlot) return false;

    const slot = pendingDeleteSlot;
    setDeletingSlot(slot);
    try {
      await deleteAppointmentImage({ id: appointmentId, slot });
      await invalidateAppointments();
      toast.success(
        slot === "before"
          ? "Foto 'Antes' removida"
          : "Foto 'Depois' removida",
      );
      setPendingDeleteSlot(null);
      return true;
    } catch (error) {
      showError(error);
      toast.error("Erro ao deletar imagem");
      return false;
    } finally {
      setDeletingSlot(null);
    }
  }, [appointmentId, invalidateAppointments, pendingDeleteSlot, showError]);

  const doUploadProfileImage = useCallback(
    async (asset: ImagePickerAsset) => {
      if (!appointment) return;

      setUploadingProfileImage(true);
      try {
        const imageKey = await uploadAssetToFolder(asset, "profile");
        if (!imageKey) return;

        await updateClientProfileImage({
          clientId: appointment.client.id,
          profileImageKey: imageKey,
        });

        await invalidateAppointments();
        toast.success("Foto de perfil atualizada!");
      } catch (error) {
        showError(error);
        toast.error("Erro ao enviar foto.");
      } finally {
        setUploadingProfileImage(false);
      }
    },
    [appointment, invalidateAppointments, showError, uploadAssetToFolder],
  );

  const uploadProfileImageFromSource = useCallback(
    async (source: "camera" | "gallery") => {
      const asset = await pickSquareImage(source, 0.8);
      if (asset) await doUploadProfileImage(asset);
    },
    [doUploadProfileImage],
  );

  const requestDeleteProfileImage = useCallback(() => {
    if (!appointment?.client.profileImageKey) return;
    setPendingDeleteProfileImage(true);
  }, [appointment?.client.profileImageKey]);

  const clearPendingDeleteProfileImage = useCallback(() => {
    setPendingDeleteProfileImage(false);
  }, []);

  const confirmDeleteProfileImage = useCallback(async (): Promise<boolean> => {
    if (!appointment) return false;

    setDeletingProfileImage(true);
    try {
      await deleteClientProfileImage(appointment.client.id);
      await invalidateAppointments();
      toast.success("Foto de perfil removida");
      setPendingDeleteProfileImage(false);
      return true;
    } catch (error) {
      showError(error);
      toast.error("Erro ao remover foto");
      return false;
    } finally {
      setDeletingProfileImage(false);
    }
  }, [appointment, invalidateAppointments, showError]);

  const openViewer = useCallback(
    (url: string | null, label: string) => {
      if (!url) return;

      setViewerImageUrl(url);
      setViewerLabel(label);
    },
    [],
  );

  const closeViewer = useCallback(() => {
    setViewerImageUrl(null);
    setViewerLabel("");
  }, []);

  return {
    beforeImageUrl: beforeImageUrl ?? null,
    afterImageUrl: afterImageUrl ?? null,
    profileImageUrl: profileImageUrl ?? null,
    uploadingSlot,
    deletingSlot,
    pendingDeleteSlot,
    uploadingProfileImage,
    deletingProfileImage,
    pendingDeleteProfileImage,
    viewerImageUrl,
    viewerLabel,
    uploadWorkImageFromSource,
    requestDeleteImage,
    clearPendingDeleteImage,
    confirmDeleteImage,
    uploadProfileImageFromSource,
    requestDeleteProfileImage,
    clearPendingDeleteProfileImage,
    confirmDeleteProfileImage,
    openViewer,
    closeViewer,
  };
}

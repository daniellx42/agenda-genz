import {
  clientDetailQueryOptions,
  clientKeys,
} from "../api/client-query-options";
import {
  deleteClientProfileImage,
  updateClient,
} from "../api/client-mutations";
import { appointmentKeys } from "@/features/appointments/api/appointment-query-options";
import { FormSheetModal } from "@/components/ui/form-sheet-modal";
import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import type { SheetTextInputRef } from "@/components/ui/sheet-text-input";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { useSquareImagePicker } from "@/hooks/use-square-image-picker";
import {
  formatCpf,
  formatPhone,
  isValidPhone,
  normalizeInstagram,
  normalizeWhitespace,
} from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import { ClientFormFields } from "../components/client-form-fields";
import { useClientForm } from "../hooks/use-client-form";
import { formatBirthDateInputFromValue } from "../lib/client-birthday";
import { ProfileAvatarEdit } from "../components/profile-avatar-edit";
import { clientSchema } from "../lib/client-form-schema";
import { uploadImageToR2 } from "../lib/client-image";
import type { ImagePickerAsset } from "expo-image-picker";
import type { ClientDetail } from "../types";

interface ClientEditSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  clientId: string | null;
  onClose: () => void;
}

function shouldShowAdditionalInfo(client?: ClientDetail | null) {
  return Boolean(
    client?.email ||
      client?.cpf ||
      client?.address ||
      client?.birthDate ||
      client?.gender ||
      client?.notes,
  );
}

export function ClientEditSheet({
  sheetRef,
  clientId,
  onClose,
}: ClientEditSheetProps) {
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const imagePicker = useSquareImagePicker();
  const [profileImageAsset, setProfileImageAsset] =
    useState<ImagePickerAsset | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const nameInputRef = useRef<SheetTextInputRef>(null);
  const phoneInputRef = useRef<SheetTextInputRef>(null);
  const formSheet = useFormSheet();

  const { data: client, isLoading: loadingClient } = useQuery(
    clientDetailQueryOptions(clientId, showError),
  );

  const { imageUrl: existingImageUrl } = useResolvedImage({
    imageKey: client?.profileImageKey,
    handleError: showError,
  });

  const pickProfileImage = () => {
    imageSourceSheetRef.current?.present();
  };

  const handleSelectImageSource = async (source: "camera" | "gallery") => {
    imageSourceSheetRef.current?.dismiss();
    const asset = await imagePicker.pickSquareImage(source, {
      title: "Ajustar foto de perfil",
      description:
        "Enquadre a foto para o perfil do cliente ficar mais bonito e padronizado.",
      confirmLabel: "Usar foto",
      quality: 0.8,
    });
    if (asset) setProfileImageAsset(asset);
  };

  const handleDeleteProfileImage = async () => {
    if (!clientId) return;

    setDeletingPhoto(true);
    try {
      await deleteClientProfileImage(clientId);
      await queryClient.invalidateQueries({
        queryKey: clientKeys.detail(clientId),
      });
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success("Foto removida");
    } catch (error) {
      showError(error);
      toast.error("Erro ao remover foto");
    } finally {
      setDeletingPhoto(false);
    }
  };

  const form = useClientForm({
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ? formatPhone(client.phone) : "",
      email: client?.email ?? "",
      instagram: client?.instagram ? normalizeInstagram(client.instagram) : "",
      cpf: client?.cpf ? formatCpf(client.cpf) : "",
      address: client?.address ?? "",
      birthDate: formatBirthDateInputFromValue(client?.birthDate),
      gender: client?.gender ?? "",
      notes: client?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!clientId) return;

      const parsed = clientSchema.safeParse(value);
      if (!parsed.success) return;

      let profileImageKey: string | undefined | null;
      if (profileImageAsset) {
        setUploadingPhoto(true);
        const key = await uploadImageToR2(
          {
            uri: profileImageAsset.uri,
            fileName: profileImageAsset.fileName,
            mimeType: profileImageAsset.mimeType,
          },
          "profile",
          showError,
        );
        setUploadingPhoto(false);

        if (!key) return;
        profileImageKey = key;
      }

      try {
        await updateClient(clientId, {
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email !== undefined ? parsed.data.email : null,
          instagram:
            parsed.data.instagram !== undefined ? parsed.data.instagram : null,
          cpf: parsed.data.cpf !== undefined ? parsed.data.cpf : null,
          address: parsed.data.address !== undefined ? parsed.data.address : null,
          birthDate:
            parsed.data.birthDate !== undefined ? parsed.data.birthDate : null,
          gender: parsed.data.gender !== undefined ? parsed.data.gender : null,
          notes: parsed.data.notes !== undefined ? parsed.data.notes : null,
          ...(profileImageKey !== undefined ? { profileImageKey } : {}),
        });

        toast.success("Cliente atualizado!");
        await queryClient.invalidateQueries({ queryKey: clientKeys.all });
        await queryClient.invalidateQueries({
          queryKey: clientKeys.detail(clientId),
        });
        await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        setProfileImageAsset(null);
        setShowAdditionalInfo(false);
        onClose();
      } catch (error) {
        showError(error);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (!client) return;

    form.reset({
      name: client.name,
      phone: client.phone ? formatPhone(client.phone) : "",
      email: client.email ?? "",
      instagram: client.instagram ? normalizeInstagram(client.instagram) : "",
      cpf: client.cpf ? formatCpf(client.cpf) : "",
      address: client.address ?? "",
      birthDate: formatBirthDateInputFromValue(client.birthDate),
      gender: client.gender ?? "",
      notes: client.notes ?? "",
    });
    setShowAdditionalInfo(shouldShowAdditionalInfo(client));
  }, [client, form]);

  const focusFirstInvalidField = useCallback(() => {
    const { name, phone } = form.state.values;

    if (normalizeWhitespace(name).length < 2) {
      nameInputRef.current?.focus();
      return true;
    }

    if (!phone || !isValidPhone(phone)) {
      phoneInputRef.current?.focus();
      return true;
    }

    return false;
  }, [form.state.values]);

  const handleSubmit = useCallback(() => {
    const shouldFocusField = focusFirstInvalidField();

    void form.handleSubmit();

    if (shouldFocusField) {
      requestAnimationFrame(() => {
        focusFirstInvalidField();
      });
    }
  }, [focusFirstInvalidField, form]);

  return (
    <>
      <FormSheetModal
        ref={sheetRef}
        formSheet={formSheet}
        snapPoints={["85%"]}
        enablePanDownToClose={
          !uploadingPhoto && !deletingPhoto && !form.state.isSubmitting
        }
        onDismiss={() => {
          setProfileImageAsset(null);
          setShowAdditionalInfo(false);
          onClose();
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
          keyboardDismissMode={formSheet.keyboardDismissMode}
        >
          <Text className="mb-5 mt-2 text-lg font-bold text-zinc-900">
            Editar cliente
          </Text>

          {loadingClient ? (
            <ActivityIndicator color="#f43f5e" style={{ marginVertical: 32 }} />
          ) : (
            <>
              <View className="mb-6 items-center">
                <ProfileAvatarEdit
                  name={client?.name ?? ""}
                  existingImageUrl={existingImageUrl ?? null}
                  existingImageCacheKey={client?.profileImageKey ?? null}
                  localUri={profileImageAsset?.uri ?? null}
                  uploading={uploadingPhoto}
                  deleting={deletingPhoto}
                  onPick={pickProfileImage}
                  onClearLocal={() => setProfileImageAsset(null)}
                  onDelete={handleDeleteProfileImage}
                />
                <Text className="mt-2 text-xs text-zinc-400">
                  Foto de perfil (opcional)
                </Text>
              </View>

              <ClientFormFields
                form={form}
                disabled={
                  uploadingPhoto || deletingPhoto || form.state.isSubmitting
                }
                showAdditionalInfo={showAdditionalInfo}
                onToggleAdditionalInfo={setShowAdditionalInfo}
                inputRefs={{
                  name: nameInputRef,
                  phone: phoneInputRef,
                }}
              />

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit || isSubmitting || uploadingPhoto}
                    className="items-center rounded-2xl bg-rose-500 py-4 active:opacity-80"
                    style={{ opacity: !canSubmit || uploadingPhoto ? 0.6 : 1 }}
                  >
                    {isSubmitting || uploadingPhoto ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-sm font-bold text-white">
                        Salvar alterações
                      </Text>
                    )}
                  </Pressable>
                )}
              </form.Subscribe>
            </>
          )}
        </BottomSheetScrollView>
      </FormSheetModal>

      <SelectionSheet
        sheetRef={imageSourceSheetRef}
        title="Foto de perfil"
        description="Escolha a origem da imagem para atualizar o perfil do cliente."
        onSelect={handleSelectImageSource}
        options={[
          {
            value: "camera",
            title: "Usar camera",
            description: "Tire uma foto quadrada direto do dispositivo.",
            icon: <Feather name="camera" size={18} color="#f43f5e" />,
          },
          {
            value: "gallery",
            title: "Escolher da galeria",
            description: "Selecione uma imagem ja salva no aparelho.",
            icon: <Feather name="image" size={18} color="#f43f5e" />,
          },
        ]}
      />
      <SquareImageCropModal {...imagePicker.cropperProps} />
    </>
  );
}

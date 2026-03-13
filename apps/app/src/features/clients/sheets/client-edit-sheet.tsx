import {
  clientDetailQueryOptions,
  clientKeys,
} from "../api/client-query-options";
import {
  deleteClientProfileImage,
  updateClient,
} from "../api/client-mutations";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { imageUrlQueryOptions } from "@/lib/api/upload-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { formatCpf, formatPhone, normalizeInstagram } from "@/lib/formatters";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";
import { ClientFormFields } from "../components/client-form-fields";
import { useClientForm } from "../hooks/use-client-form";
import { ProfileAvatarEdit } from "../components/profile-avatar-edit";
import { clientSchema } from "../lib/client-form-schema";
import { pickImageFromSource, uploadImageToR2 } from "../lib/client-image";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
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
      client?.age ||
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
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const formSheet = useFormSheet();

  const { data: client, isLoading: loadingClient } = useQuery(
    clientDetailQueryOptions(clientId, showError),
  );

  const { data: existingImageUrl } = useQuery(
    imageUrlQueryOptions(client?.profileImageKey, showError),
  );

  const pickProfileImage = () => {
    imageSourceSheetRef.current?.present();
  };

  const handleSelectImageSource = async (source: "camera" | "gallery") => {
    imageSourceSheetRef.current?.dismiss();
    const uri = await pickImageFromSource(source);
    if (uri) setProfileImageUri(uri);
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
      age: client?.age ? String(client.age) : "",
      gender: client?.gender ?? "",
      notes: client?.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!clientId) return;

      const parsed = clientSchema.safeParse(value);
      if (!parsed.success) return;

      let profileImageKey: string | undefined | null;
      if (profileImageUri) {
        setUploadingPhoto(true);
        const key = await uploadImageToR2(profileImageUri, "profile", showError);
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
          age: parsed.data.age !== undefined ? parsed.data.age : null,
          gender: parsed.data.gender !== undefined ? parsed.data.gender : null,
          notes: parsed.data.notes !== undefined ? parsed.data.notes : null,
          ...(profileImageKey !== undefined ? { profileImageKey } : {}),
        });

        toast.success("Cliente atualizado!");
        await queryClient.invalidateQueries({ queryKey: clientKeys.all });
        await queryClient.invalidateQueries({
          queryKey: clientKeys.detail(clientId),
        });
        setProfileImageUri(null);
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
      age: client.age ? String(client.age) : "",
      gender: client.gender ?? "",
      notes: client.notes ?? "",
    });
    setShowAdditionalInfo(shouldShowAdditionalInfo(client));
  }, [client, form]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["85%"]}
        bottomInset={formSheet.bottomInset}
        enablePanDownToClose={
          !uploadingPhoto && !deletingPhoto && !form.state.isSubmitting
        }
        enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#e4e4e7", width: 40 }}
        backgroundStyle={{ backgroundColor: "white", borderRadius: 24 }}
        onDismiss={() => {
          setProfileImageUri(null);
          setShowAdditionalInfo(false);
          onClose();
        }}
        keyboardBehavior={formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
                  localUri={profileImageUri}
                  uploading={uploadingPhoto}
                  deleting={deletingPhoto}
                  onPick={pickProfileImage}
                  onClearLocal={() => setProfileImageUri(null)}
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
              />

              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Pressable
                    onPress={() => form.handleSubmit()}
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
      </BottomSheetModal>

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
            icon: "📷",
          },
          {
            value: "gallery",
            title: "Escolher da galeria",
            description: "Selecione uma imagem ja salva no aparelho.",
            icon: "🖼",
          },
        ]}
      />
    </>
  );
}

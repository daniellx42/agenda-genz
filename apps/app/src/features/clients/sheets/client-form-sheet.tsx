import type { SheetTextInputRef } from "@/components/ui/sheet-text-input";
import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { useSquareImagePicker } from "@/hooks/use-square-image-picker";
import { isValidPhone, normalizeWhitespace } from "@/lib/formatters";
import Feather from "@expo/vector-icons/Feather";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import { toast } from "sonner-native";
import { createClient } from "../api/client-mutations";
import { clientKeys } from "../api/client-query-options";
import { ClientFormFields } from "../components/client-form-fields";
import { ProfileAvatarPicker } from "../components/profile-avatar-picker";
import { useClientForm } from "../hooks/use-client-form";
import { clientSchema } from "../lib/client-form-schema";
import { uploadImageToR2 } from "../lib/client-image";

interface ClientFormSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
}

export function ClientFormSheet({
  sheetRef,
  onClose,
}: ClientFormSheetProps) {
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const imagePicker = useSquareImagePicker();
  const [profileImageAsset, setProfileImageAsset] =
    useState<ImagePickerAsset | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const nameInputRef = useRef<SheetTextInputRef>(null);
  const phoneInputRef = useRef<SheetTextInputRef>(null);
  const formSheet = useFormSheet();

  const pickProfileImage = () => {
    imageSourceSheetRef.current?.present();
  };

  const handleSelectImageSource = async (source: "camera" | "gallery") => {
    imageSourceSheetRef.current?.dismiss();
    const asset = await imagePicker.pickSquareImage(source, {
      title: "Ajustar foto de perfil",
      description:
        "Enquadre a foto para deixar o perfil do cliente mais bonito no app.",
      confirmLabel: "Usar foto",
      quality: 0.8,
    });
    if (asset) setProfileImageAsset(asset);
  };

  const form = useClientForm({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      instagram: "",
      cpf: "",
      address: "",
      birthDate: "",
      gender: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      const parsed = clientSchema.safeParse(value);
      if (!parsed.success) return;

      let profileImageKey: string | undefined;
      if (profileImageAsset) {
        setUploadingPhoto(true);
        profileImageKey = await uploadImageToR2(
          {
            uri: profileImageAsset.uri,
            fileName: profileImageAsset.fileName,
            mimeType: profileImageAsset.mimeType,
          },
          "profile",
          showError,
        );
        setUploadingPhoto(false);

        if (!profileImageKey) return;
      }

      try {
        await createClient({
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || undefined,
          instagram: parsed.data.instagram || undefined,
          cpf: parsed.data.cpf || undefined,
          address: parsed.data.address || undefined,
          birthDate: parsed.data.birthDate,
          gender: parsed.data.gender,
          notes: parsed.data.notes || undefined,
          profileImageKey,
        });

        toast.success("Cliente cadastrado com sucesso!");
        await queryClient.invalidateQueries({ queryKey: clientKeys.all });
        form.reset();
        setProfileImageAsset(null);
        setShowAdditionalInfo(false);
        onClose();
      } catch (error) {
        showError(error);
        onClose();
      }
    },
  });

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
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["85%"]}
        bottomInset={formSheet.bottomInset}
        enablePanDownToClose={!uploadingPhoto && !form.state.isSubmitting}
        enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#e4e4e7", width: 40 }}
        backgroundStyle={{ backgroundColor: "white", borderRadius: 24 }}
        onDismiss={() => {
          setProfileImageAsset(null);
          setShowAdditionalInfo(false);
          onClose();
        }}
        keyboardBehavior={formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
          keyboardDismissMode="interactive"
        >
          <Text className="mb-5 mt-2 text-lg font-bold text-zinc-900">
            Novo cliente +
          </Text>

          <View className="mb-6 items-center">
            <form.Subscribe selector={(state) => state.values.name}>
              {(name) => (
                <ProfileAvatarPicker
                  name={name}
                  uri={profileImageAsset?.uri ?? null}
                  onPick={pickProfileImage}
                  onClear={() => setProfileImageAsset(null)}
                />
              )}
            </form.Subscribe>
            <Text className="mt-2 text-xs text-zinc-400">
              Foto de perfil (opcional)
            </Text>
          </View>

          <ClientFormFields
            form={form}
            disabled={uploadingPhoto || form.state.isSubmitting}
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
                    Cadastrar cliente
                  </Text>
                )}
              </Pressable>
            )}
          </form.Subscribe>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <SelectionSheet
        sheetRef={imageSourceSheetRef}
        title="Foto de perfil"
        description="Escolha a origem da imagem para o perfil do cliente."
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

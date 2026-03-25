import { useAppExperience } from "@/features/app-experience/lib/app-experience-context";
import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { openPrivacyPolicy, openTermsOfService } from "@/lib/legal-links";
import { openWhatsApp } from "@/lib/whatsapp";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Stack, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SettingsAccountActionsCard } from "../components/settings-account-actions-card";
import { SettingsAppActionsCard } from "../components/settings-app-actions-card";
import { SettingsLegalText } from "../components/settings-legal-text";
import { SettingsPhotoSourceSheet } from "../components/settings-photo-source-sheet";
import { SettingsProfileCard } from "../components/settings-profile-card";
import { SettingsSupportCard } from "../components/settings-support-card";
import { useSettingsController } from "../hooks/use-settings-controller";
import { DELETE_ACCOUNT_CONFIRMATION_TEXT } from "../lib/settings-form";
import { DeleteAccountSheet } from "../sheets/delete-account-sheet";
import { EditNameSheet } from "../sheets/edit-name-sheet";

const SUPPORT_WHATSAPP_NUMBER = "42 99823-7502";
const SUPPORT_WHATSAPP_MESSAGE =
  "Olá! Vim pelo aplicativo Agenda GenZ e preciso de ajuda.";

export default function SettingsScreen() {
  const router = useRouter();
  const appExperience = useAppExperience();
  const {
    session,
    displayName,
    setDisplayName,
    deleteConfirmation,
    setDeleteConfirmation,
    trimmedDisplayName,
    canSaveName,
    canDeleteAccount,
    profileImage,
    cropperProps,
    updateNameMutation,
    signOutMutation,
    deleteAccountMutation,
    selectImageSource,
    deleteProfileImage,
    clearLocalProfileImage,
    resetDisplayName,
    resetDeleteConfirmation,
  } = useSettingsController();
  const editNameSheetRef = useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);

  const openEditNameSheet = useCallback(() => {
    resetDisplayName();
    editNameSheetRef.current?.present();
  }, [resetDisplayName]);

  const openDeleteAccountSheet = useCallback(() => {
    resetDeleteConfirmation();
    deleteAccountSheetRef.current?.present();
  }, [resetDeleteConfirmation]);

  const openImageSourceSheet = useCallback(() => {
    if (profileImage.isBusy) return;
    imageSourceSheetRef.current?.present();
  }, [profileImage.isBusy]);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/appointments");
  }, [router]);

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-[#fff9fb]">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Configurações",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff9fb" },
          headerTintColor: "#18181b",
          contentStyle: { backgroundColor: "#fff9fb" },
          headerLeft: () => (
            <Pressable
              onPress={handleGoBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
            >
              <Feather name="chevron-left" size={20} color="#18181b" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#fff9fb" }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
          gap: 16,
        }}
      >
        <SettingsProfileCard
          name={session.user.name}
          imageUrl={profileImage.imageUrl}
          imageCacheKey={profileImage.imageCacheKey}
          localImageUri={profileImage.localUri}
          uploading={profileImage.uploading}
          deleting={profileImage.deleting}
          onPickImage={openImageSourceSheet}
          onClearLocalImage={clearLocalProfileImage}
          onDeleteImage={() => {
            void deleteProfileImage();
          }}
          onEditName={openEditNameSheet}
          editNameDisabled={updateNameMutation.isPending || profileImage.isBusy}
        />

        <SettingsAccountActionsCard
          signOutPending={signOutMutation.isPending}
          deleteAccountPending={deleteAccountMutation.isPending}
          disabled={
            signOutMutation.isPending ||
            deleteAccountMutation.isPending ||
            profileImage.isBusy
          }
          onSignOut={() => signOutMutation.mutate(undefined)}
          onDeleteAccount={openDeleteAccountSheet}
        />

        <SettingsSupportCard
          phone={SUPPORT_WHATSAPP_NUMBER}
          onPress={() => {
            void openWhatsApp(
              SUPPORT_WHATSAPP_NUMBER,
              SUPPORT_WHATSAPP_MESSAGE,
            );
          }}
        />

        <SettingsAppActionsCard
          currentVersion={appExperience.currentVersion}
          updateAvailable={appExperience.hasStoreUpdate}
          checkingForUpdates={appExperience.isCheckingForUpdates}
          onCheckUpdates={() => {
            void appExperience.checkForUpdates(true);
          }}
          onReviewApp={() => {
            void appExperience.openStoreReview();
          }}
        />

        <SettingsLegalText
          onOpenTerms={() => {
            void openTermsOfService();
          }}
          onOpenPrivacy={() => {
            void openPrivacyPolicy();
          }}
        />
      </ScrollView>

      <EditNameSheet
        sheetRef={editNameSheetRef}
        value={displayName}
        loading={updateNameMutation.isPending}
        canSubmit={canSaveName}
        onChangeText={setDisplayName}
        onClose={resetDisplayName}
        onSubmit={() =>
          updateNameMutation.mutate(trimmedDisplayName, {
            onSuccess: () => {
              editNameSheetRef.current?.dismiss();
            },
          })
        }
      />

      <DeleteAccountSheet
        sheetRef={deleteAccountSheetRef}
        value={deleteConfirmation}
        loading={deleteAccountMutation.isPending}
        canConfirm={canDeleteAccount}
        confirmationText={DELETE_ACCOUNT_CONFIRMATION_TEXT}
        onChangeText={setDeleteConfirmation}
        onClose={resetDeleteConfirmation}
        onConfirm={() => {
          if (!canDeleteAccount) return;

          deleteAccountMutation.mutate(undefined, {
            onSuccess: () => {
              deleteAccountSheetRef.current?.dismiss();
            },
          });
        }}
      />

      <SettingsPhotoSourceSheet
        sheetRef={imageSourceSheetRef}
        onSelect={(value) => {
          imageSourceSheetRef.current?.dismiss();
          void selectImageSource(value);
        }}
      />

      <SquareImageCropModal {...cropperProps} />
    </>
  );
}

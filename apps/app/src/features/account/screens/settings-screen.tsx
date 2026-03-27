import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { useAppStorePrompts } from "@/features/app-experience/lib/app-store-prompts-context";
import { ReferralSettingsCard } from "@/features/referrals/components/referral-settings-card";
import { ReferralWithdrawalSheet } from "@/features/referrals/sheets/referral-withdrawal-sheet";
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
  const appStorePrompts = useAppStorePrompts();
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
    referralSummaryQuery,
    savedReferralPixKey,
    hasCopiedReferralCode,
    generateReferralCodeMutation,
    requestReferralWithdrawalMutation,
    copyReferralCode,
  } = useSettingsController();
  const editNameSheetRef = useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const withdrawalSheetRef = useRef<BottomSheetModal>(null);

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

  const openWithdrawalSheet = useCallback(() => {
    if (!referralSummaryQuery.data?.canWithdraw) {
      return;
    }

    withdrawalSheetRef.current?.present();
  }, [referralSummaryQuery.data?.canWithdraw]);

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

        <ReferralSettingsCard
          referralCode={referralSummaryQuery.data?.referralCode ?? null}
          copiedCode={hasCopiedReferralCode}
          availableBalanceInCents={
            referralSummaryQuery.data?.availableBalanceInCents ?? 0
          }
          referralUsersCount={referralSummaryQuery.data?.referralUsersCount ?? 0}
          canWithdraw={referralSummaryQuery.data?.canWithdraw ?? false}
          generatingCode={generateReferralCodeMutation.isPending}
          requestingWithdrawal={requestReferralWithdrawalMutation.isPending}
          onGenerateCode={() => {
            generateReferralCodeMutation.mutate();
          }}
          onCopyCode={() => {
            void copyReferralCode(referralSummaryQuery.data?.referralCode ?? null);
          }}
          onWithdraw={openWithdrawalSheet}
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
          currentVersion={appStorePrompts.currentVersion}
          updateAvailable={appStorePrompts.hasStoreUpdate}
          checkingForUpdates={appStorePrompts.isCheckingForUpdates}
          onCheckUpdates={() => {
            void appStorePrompts.checkForUpdates(true);
          }}
          onReviewApp={() => {
            void appStorePrompts.openStoreReview();
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

      <ReferralWithdrawalSheet
        sheetRef={withdrawalSheetRef}
        availableBalanceInCents={
          referralSummaryQuery.data?.availableBalanceInCents ?? 0
        }
        savedPixKey={savedReferralPixKey}
        loading={requestReferralWithdrawalMutation.isPending}
        onClose={() => undefined}
        onSubmit={(input) => {
          requestReferralWithdrawalMutation.mutate(input, {
            onSuccess: () => {
              withdrawalSheetRef.current?.dismiss();
            },
          });
        }}
      />

      <SquareImageCropModal {...cropperProps} />
    </>
  );
}

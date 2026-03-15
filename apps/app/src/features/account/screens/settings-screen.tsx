import { deleteAccount } from "../api/account-mutations";
import { DeleteAccountSheet } from "../sheets/delete-account-sheet";
import { EditNameSheet } from "../sheets/edit-name-sheet";
import { ClientAvatar } from "@/features/clients/components/client-avatar";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useApiError } from "@/hooks/use-api-error";
import { authClient } from "@/lib/auth-client";
import { openPrivacyPolicy, openTermsOfService } from "@/lib/legal-links";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";

const DELETE_CONFIRMATION_TEXT = "quero deletar minha conta";

function normalizeDeletionConfirmation(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { refetch: refetchSession } = authClient.useSession();
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const editNameSheetRef = useRef<BottomSheetModal>(null);
  const deleteAccountSheetRef = useRef<BottomSheetModal>(null);
  const [displayName, setDisplayName] = useState(session?.user.name ?? "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    setDisplayName(session?.user.name ?? "");
  }, [session?.user.name]);

  const trimmedDisplayName = useMemo(
    () => displayName.trim().replace(/\s+/g, " "),
    [displayName],
  );
  const canSaveName =
    trimmedDisplayName.length >= 2 &&
    trimmedDisplayName !== (session?.user.name ?? "");
  const canDeleteAccount =
    normalizeDeletionConfirmation(deleteConfirmation) ===
    DELETE_CONFIRMATION_TEXT;

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await authClient.updateUser({ name });

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: async () => {
      toast.success("Nome atualizado!");
      editNameSheetRef.current?.dismiss();
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
      queryClient.clear();
      await refetchSession();
    },
    onError: showError,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => deleteAccount(),
    onSuccess: async () => {
      toast.success("Conta deletada com sucesso");
      deleteAccountSheetRef.current?.dismiss();
      setDeleteConfirmation("");
      queryClient.clear();
      await refetchSession();
    },
    onError: showError,
  });

  const openEditNameSheet = useCallback(() => {
    setDisplayName(session?.user.name ?? "");
    editNameSheetRef.current?.present();
  }, [session?.user.name]);

  const openDeleteAccountSheet = useCallback(() => {
    setDeleteConfirmation("");
    deleteAccountSheetRef.current?.present();
  }, []);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/appointments");
  }, [router]);

  if (!session) {
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
        <View className="flex-1 items-center justify-center bg-[#fff9fb]">
          <ActivityIndicator size="small" color="#f43f5e" />
        </View>
      </>
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
      >
        <View className="rounded-[28px] border border-rose-100 bg-white p-6">
          <View className="items-center">
            <View className="rounded-full border border-rose-100 bg-rose-50 p-2">
              <ClientAvatar
                name={session.user.name}
                imageUrl={session.user.image ?? null}
                size={104}
              />
            </View>

            <Text className="mt-4 text-lg font-bold text-zinc-900">
              Sua foto de perfil
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-zinc-500">
              Essa imagem vem da sua conta conectada e aparece aqui para você
              identificar o perfil.
            </Text>
          </View>

          <Pressable
            onPress={openEditNameSheet}
            disabled={updateNameMutation.isPending}
            className="mt-6 flex-row items-center justify-between rounded-3xl border border-rose-100 bg-[#fff9fb] px-4 py-4 active:opacity-80"
            style={{ opacity: updateNameMutation.isPending ? 0.65 : 1 }}
          >
            <View className="flex-1 pr-3">
              <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
                Nome
              </Text>
              <Text className="mt-1 text-base font-semibold text-zinc-900">
                {session.user.name}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-zinc-500">
                Editar
              </Text>
              <Feather name="edit-2" size={16} color="#71717a" />
            </View>
          </Pressable>
        </View>

        <View className="rounded-[28px] border border-rose-100 bg-white p-5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Conta
          </Text>

          <Pressable
            onPress={() => signOutMutation.mutate(undefined)}
            disabled={signOutMutation.isPending || deleteAccountMutation.isPending}
            className="mt-4 flex-row items-center gap-4 rounded-3xl bg-[#fff9fb] px-4 py-4 active:opacity-80"
            style={{
              opacity:
                signOutMutation.isPending || deleteAccountMutation.isPending
                  ? 0.65
                  : 1,
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100">
              {signOutMutation.isPending ? (
                <ActivityIndicator size="small" color="#18181b" />
              ) : (
                <Feather name="log-out" size={18} color="#18181b" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-zinc-900">
                Sair do aplicativo
              </Text>
              <Text className="mt-1 text-sm leading-5 text-zinc-500">
                Encerra sua sessão neste dispositivo.
              </Text>
            </View>

            <Feather name="chevron-right" size={18} color="#a1a1aa" />
          </Pressable>

          <View className="my-4 h-px bg-rose-100" />

          <Pressable
            onPress={openDeleteAccountSheet}
            disabled={signOutMutation.isPending || deleteAccountMutation.isPending}
            className="flex-row items-center gap-4 rounded-3xl bg-red-50 px-4 py-4 active:opacity-80"
            style={{
              opacity:
                signOutMutation.isPending || deleteAccountMutation.isPending
                  ? 0.65
                  : 1,
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
              {deleteAccountMutation.isPending ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Feather name="trash-2" size={18} color="#ef4444" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-semibold text-red-600">
                Deletar conta
              </Text>
              <Text className="mt-1 text-sm leading-5 text-red-500">
                Remove sua conta e todos os dados do aplicativo.
              </Text>
            </View>

            <Feather name="chevron-right" size={18} color="#f87171" />
          </Pressable>
        </View>

        <Text className="px-2 text-center text-xs leading-6 text-zinc-400">
          Ao continuar usando o aplicativo, você concorda com nossos{" "}
          <Text
            className="font-semibold text-rose-400"
            accessibilityRole="link"
            onPress={() => {
              void openTermsOfService();
            }}
          >
            Termos de Serviço
          </Text>{" "}
          e{" "}
          <Text
            className="font-semibold text-rose-400"
            accessibilityRole="link"
            onPress={() => {
              void openPrivacyPolicy();
            }}
          >
            Política de Privacidade
          </Text>
          .
        </Text>
      </ScrollView>

      <EditNameSheet
        sheetRef={editNameSheetRef}
        value={displayName}
        loading={updateNameMutation.isPending}
        canSubmit={canSaveName}
        onChangeText={setDisplayName}
        onClose={() => setDisplayName(session.user.name)}
        onSubmit={() => updateNameMutation.mutate(trimmedDisplayName)}
      />

      <DeleteAccountSheet
        sheetRef={deleteAccountSheetRef}
        value={deleteConfirmation}
        loading={deleteAccountMutation.isPending}
        canConfirm={canDeleteAccount}
        confirmationText={DELETE_CONFIRMATION_TEXT}
        onChangeText={setDeleteConfirmation}
        onClose={() => setDeleteConfirmation("")}
        onConfirm={() => {
          if (!canDeleteAccount) return;
          deleteAccountMutation.mutate(undefined);
        }}
      />
    </>
  );
}

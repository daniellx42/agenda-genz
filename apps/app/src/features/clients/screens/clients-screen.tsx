import {
  clientKeys,
  clientsInfiniteQueryOptions,
} from "../api/client-query-options";
import { deleteClient } from "../api/client-mutations";
import { ClientCard } from "../components/client-card";
import { ClientCardSkeleton } from "../components/client-card-skeleton";
import { ClientFollowUpShareSheet } from "../components/client-follow-up-share-sheet";
import { formatClientDate, formatDaysLabel, getDaysSince } from "../lib/client-relative-time";
import { buildClientFollowUpMessage } from "../lib/client-share-messages";
import { openWhatsApp } from "../lib/client-whatsapp";
import { ClientEditSheet } from "../sheets/client-edit-sheet";
import { ClientFormSheet } from "../sheets/client-form-sheet";
import { ConfirmActionSheet } from "@/components/ui/confirm-action-sheet";
import { useRegisterTabContextualAction } from "@/features/navigation/lib/tab-contextual-action-context";
import { useApiError } from "@/hooks/use-api-error";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import type { ClientItem } from "../types";

export default function ClientsScreen() {
  const createSheetRef = useRef<BottomSheetModal>(null);
  const editSheetRef = useRef<BottomSheetModal>(null);
  const confirmDeleteSheetRef = useRef<BottomSheetModal>(null);
  const followUpShareSheetRef = useRef<BottomSheetModal>(null);
  const { showError } = useApiError();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [pendingDeleteClient, setPendingDeleteClient] =
    useState<ClientItem | null>(null);
  const [followUpClient, setFollowUpClient] = useState<ClientItem | null>(null);
  const [followUpDraftMessage, setFollowUpDraftMessage] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    clientsInfiniteQueryOptions(debouncedSearch, showError),
  );

  const clients = (data?.pages ?? [])
    .flatMap((page) => page.data)
    .filter((client, index, array) => {
      return array.findIndex((item) => item.id === client.id) === index;
    });
  const totalClients = data?.pages[0]?.pagination.total ?? 0;

  const openCreate = useCallback(() => {
    createSheetRef.current?.present();
  }, []);

  useRegisterTabContextualAction({
    routeName: "clients",
    label: "Novo cliente",
    accessibilityLabel: "Novo cliente",
    onPress: openCreate,
  });

  const closeCreate = useCallback(() => {
    createSheetRef.current?.dismiss();
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingClientId(id);
    editSheetRef.current?.present();
  }, []);

  const closeEdit = useCallback(() => {
    editSheetRef.current?.dismiss();
    setEditingClientId(null);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: async () => {
      toast.success("Cliente deletado");
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
      confirmDeleteSheetRef.current?.dismiss();
      setPendingDeleteClient(null);
    },
    onError: showError,
  });

  const handleDelete = useCallback((client: ClientItem) => {
    setPendingDeleteClient(client);
    confirmDeleteSheetRef.current?.present();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleDismissFollowUpShareSheet = useCallback(() => {
    setFollowUpClient(null);
    setFollowUpDraftMessage("");
  }, []);

  const openFollowUpShareSheet = useCallback((client: ClientItem) => {
    if (!client.lastCompletedAppointmentDate) return;

    const daysSinceLastAppointment = getDaysSince(client.lastCompletedAppointmentDate);

    if (daysSinceLastAppointment === null) {
      return;
    }

    setFollowUpClient(client);
    setFollowUpDraftMessage(
      buildClientFollowUpMessage({
        clientName: client.name,
        daysSinceLastAppointment,
      }),
    );
    followUpShareSheetRef.current?.present();
  }, []);

  const handleShareFollowUpViaWhatsApp = useCallback(async () => {
    if (!followUpClient) return;

    followUpShareSheetRef.current?.dismiss();
    await openWhatsApp(followUpClient.phone, followUpDraftMessage);
  }, [followUpClient, followUpDraftMessage]);

  const handleShareFollowUpNative = useCallback(async () => {
    followUpShareSheetRef.current?.dismiss();

    try {
      await Share.share({ message: followUpDraftMessage });
    } catch (error) {
      showError(error);
    }
  }, [followUpDraftMessage, showError]);

  const followUpDays = followUpClient?.lastCompletedAppointmentDate
    ? getDaysSince(followUpClient.lastCompletedAppointmentDate)
    : null;
  const followUpHighlightLabel =
    followUpDays !== null
      ? `Último atendimento há ${formatDaysLabel(followUpDays)}`
      : "";
  const followUpLastAppointmentLabel = followUpClient?.lastCompletedAppointmentDate
    ? formatClientDate(followUpClient.lastCompletedAppointmentDate)
    : "";
  const hasFollowUpPhone = (followUpClient?.phone ?? "").trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <View>
          <Text className="text-xl font-bold text-zinc-900">Clientes</Text>
          <Text className="text-xs text-zinc-400">
            {totalClients} cadastrados
          </Text>
        </View>
        <Pressable
          onPress={openCreate}
          className="h-10 w-10 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
        >
          <Feather name="plus" size={20} color="white" />
        </Pressable>
      </View>

      <View className="mb-3 px-5">
        <TextInput
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
          placeholder="Buscar por nome, telefone, CPF, email ou Instagram..."
          placeholderTextColor="#a1a1aa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <ClientCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientCard
              client={item}
              onEdit={() => openEdit(item.id)}
              onDelete={() => handleDelete(item)}
              onOpenFollowUpShare={() => openFollowUpShareSheet(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={() => {
            void refetch();
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <Feather name="users" size={24} color="#f43f5e" />
              </View>
              <Text className="mb-4 text-sm text-zinc-500">
                Nenhum cliente encontrado
              </Text>
              <Pressable
                onPress={openCreate}
                className="rounded-2xl bg-rose-500 px-6 py-3"
              >
                <Text className="text-sm font-semibold text-white">
                  Cadastrar primeiro cliente
                </Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#f43f5e" style={{ marginTop: 12 }} />
            ) : null
          }
        />
      )}

      <ClientFormSheet sheetRef={createSheetRef} onClose={closeCreate} />
      <ClientEditSheet
        sheetRef={editSheetRef}
        clientId={editingClientId}
        onClose={closeEdit}
      />

      <ClientFollowUpShareSheet
        sheetRef={followUpShareSheetRef}
        clientName={followUpClient?.name ?? ""}
        lastAppointmentLabel={followUpLastAppointmentLabel}
        highlightLabel={followUpHighlightLabel}
        message={followUpDraftMessage}
        onChangeMessage={setFollowUpDraftMessage}
        disableWhatsApp={!hasFollowUpPhone}
        onDismiss={handleDismissFollowUpShareSheet}
        onShareWhatsApp={() => void handleShareFollowUpViaWhatsApp()}
        onShareMore={() => void handleShareFollowUpNative()}
      />

      <ConfirmActionSheet
        sheetRef={confirmDeleteSheetRef}
        title="Deletar cliente"
        description={
          pendingDeleteClient
            ? `Tem certeza que deseja deletar "${pendingDeleteClient.name}"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja deletar este cliente?"
        }
        confirmLabel="Deletar cliente"
        loading={deleteMutation.isPending}
        onClose={() => setPendingDeleteClient(null)}
        onConfirm={() => {
          if (!pendingDeleteClient) return;
          deleteMutation.mutate(pendingDeleteClient.id);
        }}
      />
    </SafeAreaView>
  );
}

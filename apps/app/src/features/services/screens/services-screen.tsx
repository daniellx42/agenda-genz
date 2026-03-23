import {
  serviceKeys,
  serviceExportQueryOptions,
  servicesInfiniteQueryOptions,
} from "../api/service-query-options";
import {
  deleteService,
  updateServiceStatus,
} from "../api/service-mutations";
import { ServiceCard } from "../components/service-card";
import { ServiceCardSkeleton } from "../components/service-card-skeleton";
import { exportServices } from "../lib/export-services";
import { ServiceFormSheet } from "../sheets/service-form-sheet";
import { ConfirmActionSheet } from "@/components/ui/confirm-action-sheet";
import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { useRegisterTabContextualAction } from "@/features/navigation/lib/tab-contextual-action-context";
import { useApiError } from "@/hooks/use-api-error";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import type { ServiceItem } from "../types";

export default function ServicesScreen() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const confirmDeleteSheetRef = useRef<BottomSheetModal>(null);
  const { session } = useAuthSession();
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [pendingDeleteService, setPendingDeleteService] = useState<ServiceItem | null>(null);
  const [exportingServices, setExportingServices] = useState(false);
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
    servicesInfiniteQueryOptions(debouncedSearch, showError),
  );

  const services = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data)
        .filter((service, index, array) => {
          return array.findIndex((item) => item.id === service.id) === index;
        }),
    [data?.pages],
  );
  const totalServices = data?.pages[0]?.pagination.total ?? 0;

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      updateServiceStatus(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
    onError: showError,
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => deleteService(serviceId, showError),
    onSuccess: async () => {
      toast.success("Serviço deletado!");
      await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      confirmDeleteSheetRef.current?.dismiss();
      setPendingDeleteService(null);
    },
    onError: showError,
  });

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
    setEditingService(null);
  }, []);

  const openCreateSheet = useCallback(() => {
    setEditingService(null);
    sheetRef.current?.present();
  }, []);

  useRegisterTabContextualAction({
    routeName: "services",
    label: "Novo servico",
    accessibilityLabel: "Novo servico",
    onPress: openCreateSheet,
  });

  const openEditSheet = useCallback((service: ServiceItem) => {
    setEditingService(service);
    sheetRef.current?.present();
  }, []);

  const openDeleteSheet = useCallback((service: ServiceItem) => {
    setPendingDeleteService(service);
    confirmDeleteSheetRef.current?.present();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleExportServices = useCallback(async () => {
    setExportingServices(true);

    try {
      const allServices = await queryClient.fetchQuery(
        serviceExportQueryOptions(showError),
      );
      const professionalName = session?.user?.name ?? "Profissional";
      await exportServices(allServices, professionalName);
    } catch (error) {
      showError(error);
    } finally {
      setExportingServices(false);
    }
  }, [queryClient, session?.user?.name, showError]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
        <View>
          <Text className="text-xl font-bold text-zinc-900">Serviços</Text>
          <Text className="text-xs text-zinc-400">
            {totalServices} cadastrados
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              void handleExportServices();
            }}
            disabled={exportingServices || totalServices === 0}
            className="h-10 w-10 items-center justify-center rounded-full bg-rose-100 active:opacity-70"
            style={{ opacity: exportingServices || totalServices === 0 ? 0.45 : 1 }}
          >
            {exportingServices ? (
              <ActivityIndicator color="#f43f5e" size="small" />
            ) : (
              <Feather name="share-2" size={18} color="#f43f5e" />
            )}
          </Pressable>
          <Pressable
            onPress={openCreateSheet}
            className="h-10 w-10 items-center justify-center rounded-full bg-rose-500 active:opacity-70"
          >
            <Feather name="plus" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      <View className="mb-3 px-5">
        <TextInput
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900"
          placeholder="Buscar serviço pelo nome..."
          placeholderTextColor="#a1a1aa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onToggle={(id, active) => toggleMutation.mutate({ id, active })}
              onEdit={openEditSheet}
              onDelete={openDeleteSheet}
              toggleLoading={toggleMutation.isPending && toggleMutation.variables?.id === item.id}
              deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
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
                <MaterialCommunityIcons
                  name="content-cut"
                  size={24}
                  color="#f43f5e"
                />
              </View>
              <Text className="mb-4 text-sm text-zinc-500">
                Nenhum serviço cadastrado
              </Text>
              <Pressable
                onPress={openCreateSheet}
                className="rounded-2xl bg-rose-500 px-6 py-3"
              >
                <Text className="text-sm font-semibold text-white">
                  Cadastrar primeiro serviço
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

      <ServiceFormSheet
        sheetRef={sheetRef}
        onClose={closeSheet}
        service={editingService}
      />

      <ConfirmActionSheet
        sheetRef={confirmDeleteSheetRef}
        title="Remover serviço"
        description={
          pendingDeleteService
            ? `Tem certeza que deseja remover "${pendingDeleteService.name}"? Esta ação não poderá ser desfeita.`
            : "Tem certeza que deseja remover este serviço?"
        }
        confirmLabel="Deletar serviço"
        loading={deleteMutation.isPending}
        onClose={() => setPendingDeleteService(null)}
        onConfirm={() => {
          if (!pendingDeleteService) return;
          deleteMutation.mutate(pendingDeleteService.id);
        }}
      />
    </SafeAreaView>
  );
}

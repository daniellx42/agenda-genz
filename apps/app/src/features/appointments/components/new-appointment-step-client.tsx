import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { NewAppointmentClientOptionCard } from "@/features/appointments/components/new-appointment-client-option-card";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { clientsInfiniteQueryOptions } from "@/features/clients/api/client-query-options";
import { ClientCardSkeleton } from "@/features/clients/components/client-card-skeleton";
import { useApiError } from "@/hooks/use-api-error";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Feather from "@expo/vector-icons/Feather";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export function StepClient() {
  const { setClient } = useAppointmentDraft();
  const { showError } = useApiError();
  const router = useRouter();
  const { dismissAll } = useBottomSheetModal();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const normalizedSearch = debouncedSearch.trim();
  const hasSearch = normalizedSearch.length > 0;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    clientsInfiniteQueryOptions(normalizedSearch, showError, hasSearch),
  );

  const clients = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data)
        .filter((client, index, array) => {
          return array.findIndex((item) => item.id === client.id) === index;
        }),
    [data?.pages],
  );

  return (
    <View className="flex-1">
      <Text className="text-lg font-bold text-zinc-900 mb-1">
        Selecionar cliente
      </Text>
      <Text className="text-sm text-zinc-400 mb-4">
        Digite para buscar por nome, telefone, CPF, email ou Instagram
      </Text>

      <SheetTextInput
        className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 mb-3"
        placeholder="Nome, telefone, CPF, email ou Instagram..."
        placeholderTextColor="#a1a1aa"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {hasSearch && isLoading && (
        <View className="mt-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <ClientCardSkeleton key={index} />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {!hasSearch ? (
          <View className="items-center py-8">
            <Text className="mb-4 text-center text-sm text-zinc-400">
              Digite pelo menos um termo para buscar clientes
            </Text>
            <Pressable
              onPress={() => {
                dismissAll();
                router.navigate("/clients");
              }}
              className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
            >
              <Text className="text-rose-500 font-semibold text-sm">
                Novo cliente +
              </Text>
            </Pressable>
          </View>
        ) : null}

        {clients.map((client) => (
          <NewAppointmentClientOptionCard
            key={client.id}
            client={client}
            onPress={() =>
              setClient({
                id: client.id,
                name: client.name,
                phone: client.phone ?? "",
                profileImageKey: client.profileImageKey,
              })
            }
          />
        ))}

        {hasSearch && hasNextPage ? (
          <Pressable
            onPress={() => {
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            className="mb-2 mt-2 items-center rounded-2xl border border-rose-200 bg-rose-50 py-3 active:opacity-80"
            style={{ opacity: isFetchingNextPage ? 0.6 : 1 }}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator color="#f43f5e" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-rose-500">
                Carregar mais clientes
              </Text>
            )}
          </Pressable>
        ) : null}

        {hasSearch && clients.length === 0 && !isLoading && (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-sm mb-4">
              Nenhum cliente encontrado
            </Text>
            <Pressable
              onPress={() => {
                dismissAll();
                router.navigate("/clients");
              }}
              className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
            >
              <Text className="text-rose-500 font-semibold text-sm">
                Novo cliente +
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

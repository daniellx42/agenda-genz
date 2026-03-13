import { clientsInfiniteQueryOptions } from "@/features/clients/api/client-query-options";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { ClientCardSkeleton } from "@/features/clients/components/client-card-skeleton";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useApiError } from "@/hooks/use-api-error";
import { formatPhone } from "@/lib/formatters";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function StepClient() {
  const { setClient } = useAppointmentDraft();
  const { showError } = useApiError();
  const router = useRouter();
  const { dismissAll } = useBottomSheetModal();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    clientsInfiniteQueryOptions(debouncedSearch, showError),
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
        Busque por nome, telefone, CPF, email ou Instagram
      </Text>

      <SheetTextInput
        className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 mb-3"
        placeholder="Nome, telefone, CPF, email ou Instagram..."
        placeholderTextColor="#a1a1aa"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {isLoading && (
        <View className="mt-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <ClientCardSkeleton key={index} />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {clients.map((client) => (
          <Pressable
            key={client.id}
            onPress={() =>
              setClient({
                id: client.id,
                name: client.name,
                phone: client.phone ?? "",
              })
            }
            className="flex-row items-center gap-3 bg-white border border-zinc-100 rounded-2xl p-4 mb-2 active:opacity-70"
          >
            <View className="w-10 h-10 rounded-full bg-rose-100 items-center justify-center">
              <Feather name="user" size={16} color="#f43f5e" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-zinc-900">
                {client.name}
              </Text>
              <Text className="text-xs text-zinc-400">{formatPhone(client.phone)}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#d4d4d8" />
          </Pressable>
        ))}

        {hasNextPage ? (
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

        {clients.length === 0 && !isLoading && (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-sm mb-4">
              Nenhum cliente encontrado
            </Text>
            <Pressable
              onPress={() => {
                dismissAll();
                router.navigate("/clients" as never);
              }}
              className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
            >
              <Text className="text-rose-500 font-semibold text-sm">
                Novo cliente
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

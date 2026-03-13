import { activeServicesInfiniteQueryOptions } from "@/features/services/api/service-query-options";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { ServiceCardSkeleton } from "@/features/services/components/service-card-skeleton";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
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

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function StepService() {
  const { setService } = useAppointmentDraft();
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
    activeServicesInfiniteQueryOptions(debouncedSearch, showError),
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

  return (
    <View className="flex-1">
      <Text className="text-lg font-bold text-zinc-900 mb-1">
        Selecionar serviço
      </Text>
      <Text className="text-sm text-zinc-400 mb-4">
        Escolha o serviço a ser realizado
      </Text>

      <SheetTextInput
        className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 mb-3"
        placeholder="Buscar serviço pelo nome..."
        placeholderTextColor="#a1a1aa"
        value={search}
        onChangeText={setSearch}
      />

      {isLoading && (
        <View className="mt-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {services.map((service) => (
          <Pressable
            key={service.id}
            onPress={() =>
              setService({
                id: service.id,
                name: service.name,
                price: service.price,
                depositPercentage: service.depositPercentage,
                emoji: service.emoji,
                color: service.color,
              })
            }
            className="bg-white border border-zinc-100 rounded-2xl p-4 mb-2 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center"
                style={{ backgroundColor: service.color ?? "#fce7f3" }}
              >
                <Text className="text-lg">{service.emoji ?? "✨"}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-zinc-900">
                  {service.name}
                </Text>
                {service.depositPercentage != null && (
                  <View className="mt-1 flex-row items-center gap-1">
                    <Feather name="credit-card" size={12} color="#3b82f6" />
                    <Text className="text-xs font-medium text-blue-500">
                      {service.depositPercentage}% sinal
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm font-bold text-rose-500">
                {formatPrice(service.price)}
              </Text>
            </View>
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
                Carregar mais serviços
              </Text>
            )}
          </Pressable>
        ) : null}

        {services.length === 0 && !isLoading && (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-sm mb-4">
              Nenhum serviço encontrado
            </Text>
            <Pressable
              onPress={() => {
                dismissAll();
                router.navigate("/services" as never);
              }}
              className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
            >
              <Text className="text-rose-500 font-semibold text-sm">
                Novo serviço
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

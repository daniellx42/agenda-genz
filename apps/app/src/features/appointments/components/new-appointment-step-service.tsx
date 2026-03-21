import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { activeServicesQueryOptions } from "@/features/services/api/service-query-options";
import { ServiceImage } from "@/features/services/components/service-image";
import { ServiceCardSkeleton } from "@/features/services/components/service-card-skeleton";
import { useApiError } from "@/hooks/use-api-error";
import Feather from "@expo/vector-icons/Feather";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
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
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const { data: allServices = [], isLoading } = useQuery(
    activeServicesQueryOptions(showError),
  );

  const services = useMemo(
    () =>
      allServices.filter((service) => {
        if (!normalizedSearch) return true;

        return service.name.toLocaleLowerCase().includes(normalizedSearch);
      }),
    [allServices, normalizedSearch],
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
                imageKey: service.imageKey,
                color: service.color,
              })
            }
            className="bg-white border border-zinc-100 rounded-2xl p-4 mb-2 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <ServiceImage
                imageKey={service.imageKey}
                backgroundColor={service.color}
                size={40}
                borderRadius={16}
                iconSize={18}
              />
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

        {services.length === 0 && !isLoading && (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-sm mb-4">
              Nenhum serviço encontrado
            </Text>
            <Pressable
              onPress={() => {
                dismissAll();
                router.navigate("/services");
              }}
              className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
            >
              <Text className="text-rose-500 font-semibold text-sm">
                Novo serviço +
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

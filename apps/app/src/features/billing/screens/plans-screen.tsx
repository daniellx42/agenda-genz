import { useApiError } from "@/hooks/use-api-error";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { billingPlansQueryOptions } from "../api/billing-query-options";
import { PlanCard } from "../components/plan-card";

export default function PlansScreen() {
  const { showError } = useApiError();
  const router = useRouter();

  const { data: plans, isLoading, isError, refetch } = useQuery(
    billingPlansQueryOptions(showError),
  );

  const handleOpenPlan = (planId: string) => {
    router.push({
      pathname: "/(paywall)/checkout",
      params: { planId },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 36,
          gap: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
              Planos disponíveis
            </Text>
            <Text className="mt-1 text-xl font-bold text-zinc-900">
              Escolha o plano ideal para sua rotina
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="rounded-[28px] border border-rose-100 bg-white px-6 py-10">
            <ActivityIndicator size="large" color="#f43f5e" />
            <Text className="mt-4 text-center text-base text-zinc-500">
              Carregando os planos...
            </Text>
          </View>
        ) : isError ? (
          <View className="rounded-[28px] border border-rose-100 bg-white px-6 py-10">
            <Text className="text-center text-base text-zinc-500">
              Não foi possível carregar os planos agora.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-5 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            {plans?.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                interval={plan.interval}
                name={plan.name}
                priceInCents={plan.priceInCents}
                durationDays={plan.durationDays}
                discountLabel={plan.discountLabel}
                onPress={handleOpenPlan}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

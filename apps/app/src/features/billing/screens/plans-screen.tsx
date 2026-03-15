import { useApiError } from "@/hooks/use-api-error";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: plans, isLoading, isError, refetch } = useQuery(
    billingPlansQueryOptions(showError),
  );

  const handleContinue = () => {
    if (!selectedPlanId) return;
    router.push({
      pathname: "/(paywall)/checkout",
      params: { planId: selectedPlanId },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-rose-100 items-center justify-center mb-4">
            <Text className="text-4xl">&#x2728;</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Escolha seu plano
          </Text>
          <Text className="text-base text-gray-500 text-center mt-2">
            Continue gerenciando seus agendamentos
          </Text>
        </View>

        {/* Plans */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#fb7185" className="mt-8" />
        ) : isError ? (
          <View className="items-center mt-8">
            <Text className="text-base text-gray-500 text-center mb-4">
              Não foi possível carregar os planos.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="bg-rose-400 rounded-2xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Tentar novamente</Text>
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
                isSelected={selectedPlanId === plan.id}
                onSelect={setSelectedPlanId}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      <View className="px-6 pb-6 pt-3 border-t border-gray-100">
        <Pressable
          onPress={handleContinue}
          disabled={!selectedPlanId}
          className={`rounded-2xl py-4 items-center ${selectedPlanId ? "bg-rose-400" : "bg-gray-200"
            }`}
        >
          <Text
            className={`text-lg font-semibold ${selectedPlanId ? "text-white" : "text-gray-400"
              }`}
          >
            Continuar
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

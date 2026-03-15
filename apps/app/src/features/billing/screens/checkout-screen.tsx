import { useApiError } from "@/hooks/use-api-error";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCheckout } from "../api/billing-mutations";
import {
  billingPaymentStatusQueryOptions,
} from "../api/billing-query-options";
import { PaymentStatusIndicator } from "../components/payment-status-indicator";
import { PixQrDisplay } from "../components/pix-qr-display";
import { usePaymentWs } from "../hooks/use-payment-ws";
import { formatPrice } from "../lib/billing-formatters";
import { useSubscriptionStore } from "../store/subscription-store";

interface CheckoutData {
  paymentId: string;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string;
  amount: number;
  planName: string;
}

export default function CheckoutScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const { showError } = useApiError();
  const { setPlanExpiresAt } = useSubscriptionStore();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const didCreateRef = useRef(false);

  // Create checkout on mount
  useEffect(() => {
    if (!planId || didCreateRef.current) return;
    didCreateRef.current = true;

    createCheckout({ planId }, showError)
      .then((data) => {
        if (data) setCheckout(data);
      })
      .catch(showError)
      .finally(() => setIsCreating(false));
  }, [planId]);

  // Poll payment status as fallback
  const { data: paymentStatus } = useQuery(
    billingPaymentStatusQueryOptions(checkout?.paymentId, showError),
  );

  // Handle payment approval from polling
  useEffect(() => {
    if (paymentStatus?.status === "APPROVED" && !isApproved) {
      handleApproved(paymentStatus.expiresAt ?? "");
    }
  }, [paymentStatus?.status]);

  // WebSocket for real-time confirmation
  const handleApproved = useCallback(
    (planExpiresAt: string) => {
      setIsApproved(true);
      setPlanExpiresAt(planExpiresAt);
      setTimeout(() => {
        router.replace("/(paywall)/success");
      }, 1500);
    },
    [setPlanExpiresAt, router],
  );

  const { connect, disconnect } = usePaymentWs({
    onPaymentApproved: (data) => handleApproved(data.planExpiresAt),
  });

  // Connect WS when checkout is ready
  useEffect(() => {
    if (checkout) {
      connect();
      return () => disconnect();
    }
  }, [checkout?.paymentId]);

  if (isCreating) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#fb7185" />
        <Text className="text-base text-gray-500 mt-4">
          Gerando pagamento PIX...
        </Text>
      </SafeAreaView>
    );
  }

  if (!checkout) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Erro ao criar pagamento
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-rose-400 rounded-2xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with back button */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Feather name="arrow-left" size={24} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900 mr-10">
          Pagamento PIX
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Plan summary */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <Text className="text-sm text-gray-500">Plano selecionado</Text>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-lg font-semibold text-gray-900">
              {checkout.planName}
            </Text>
            <Text className="text-lg font-bold text-gray-900">
              {formatPrice(checkout.amount)}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <PixQrDisplay
          pixQrCode={checkout.pixQrCode}
          pixQrCodeBase64={checkout.pixQrCodeBase64}
          pixExpiresAt={checkout.pixExpiresAt}
        />

        {/* Status indicator */}
        <View className="mt-6">
          <PaymentStatusIndicator
            status={isApproved ? "approved" : "waiting"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

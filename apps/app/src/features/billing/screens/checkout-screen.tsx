import { authClient } from "@/lib/auth-client";
import { useApiError } from "@/hooks/use-api-error";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { createCheckout } from "../api/billing-mutations";
import { billingPaymentStatusQueryOptions } from "../api/billing-query-options";
import { PaymentStatusIndicator } from "../components/payment-status-indicator";
import { PixQrDisplay } from "../components/pix-qr-display";
import { usePaymentWs } from "../hooks/use-payment-ws";
import {
  resolveBillingStatus,
  type BillingRuntimeStatus,
  type PendingCheckoutSnapshot,
} from "../lib/billing-flow";
import { formatPrice } from "../lib/billing-formatters";
import {
  clearPendingCheckout,
  getPendingCheckoutById,
  savePendingCheckout,
} from "../lib/pending-checkout-storage";
import { useSubscriptionStore } from "../store/subscription-store";

function normalizeParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function CheckoutScreen() {
  const { planId: rawPlanId, paymentId: rawPaymentId } =
    useLocalSearchParams<{
      planId?: string | string[];
      paymentId?: string | string[];
    }>();
  const planId = normalizeParam(rawPlanId);
  const routePaymentId = normalizeParam(rawPaymentId);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showError } = useApiError();
  const { refetch: refetchSession } = authClient.useSession();
  const { setPlanExpiresAt } = useSubscriptionStore();
  const [checkout, setCheckout] = useState<PendingCheckoutSnapshot | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(
    Boolean(planId && !routePaymentId),
  );
  const [isHydratingCheckout, setIsHydratingCheckout] = useState(
    Boolean(routePaymentId),
  );
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const didCreateCheckoutRef = useRef(false);
  const handledApprovalRef = useRef(false);

  const paymentId = checkout?.paymentId ?? routePaymentId;

  useEffect(() => {
    handledApprovalRef.current = false;
    setIsApproved(false);
    setHasCopiedCode(false);
  }, [paymentId]);

  useEffect(() => {
    if (!routePaymentId) {
      setIsHydratingCheckout(false);
      return;
    }

    let isActive = true;
    setIsHydratingCheckout(true);

    void getPendingCheckoutById(routePaymentId)
      .then((snapshot) => {
        if (!isActive) return;
        if (snapshot) {
          setCheckout(snapshot);
        }
      })
      .finally(() => {
        if (!isActive) return;
        setIsHydratingCheckout(false);
      });

    return () => {
      isActive = false;
    };
  }, [routePaymentId]);

  useEffect(() => {
    if (!planId || routePaymentId || didCreateCheckoutRef.current) {
      if (!planId || routePaymentId) {
        setIsCreating(false);
      }
      return;
    }

    didCreateCheckoutRef.current = true;
    setIsCreating(true);

    void createCheckout({ planId }, showError)
      .then((data) => {
        if (!data) return;

        const snapshot: PendingCheckoutSnapshot = {
          ...data,
          planId,
          createdAt: new Date().toISOString(),
        };

        setCheckout(snapshot);
        void savePendingCheckout(snapshot);
      })
      .catch(() => undefined)
      .finally(() => setIsCreating(false));
  }, [planId, routePaymentId, showError]);

  const {
    data: paymentStatus,
    refetch: refetchPaymentStatus,
    isPending: isLoadingPaymentStatus,
    isFetching: isCheckingPaymentStatus,
    isError: isPaymentStatusError,
  } = useQuery(billingPaymentStatusQueryOptions(paymentId ?? undefined));

  const paymentRuntimeStatus = resolveBillingStatus(
    paymentStatus?.status ?? (isApproved ? "APPROVED" : paymentId ? "PENDING" : null),
    paymentStatus?.pixExpiresAt ?? checkout?.pixExpiresAt ?? null,
  );

  const handleApproved = useCallback(
    (planExpiresAt: string | null | undefined) => {
      if (handledApprovalRef.current) return;

      handledApprovalRef.current = true;
      setIsApproved(true);

      if (planExpiresAt) {
        setPlanExpiresAt(planExpiresAt);
      }

      void clearPendingCheckout();
      void refetchSession();
      router.replace("/(paywall)/success");
    },
    [refetchSession, router, setPlanExpiresAt],
  );

  useEffect(() => {
    if (paymentStatus?.status === "APPROVED") {
      handleApproved(paymentStatus.expiresAt);
    }
  }, [handleApproved, paymentStatus?.expiresAt, paymentStatus?.status]);

  useEffect(() => {
    if (
      paymentRuntimeStatus &&
      paymentRuntimeStatus !== "PENDING" &&
      paymentRuntimeStatus !== "APPROVED"
    ) {
      void clearPendingCheckout();
    }
  }, [paymentRuntimeStatus]);

  const { connect, disconnect } = usePaymentWs({
    paymentId,
    onPaymentApproved: (data) => handleApproved(data.planExpiresAt),
    onConnected: () => {
      void refetchPaymentStatus();
    },
  });

  useEffect(() => {
    if (!paymentId || paymentRuntimeStatus !== "PENDING") return;

    connect();
    return () => disconnect();
  }, [connect, disconnect, paymentId, paymentRuntimeStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;

      if (paymentId && paymentRuntimeStatus === "PENDING") {
        connect();
        void refetchPaymentStatus();
      }

      void refetchSession();
    });

    return () => sub.remove();
  }, [
    connect,
    paymentId,
    paymentRuntimeStatus,
    refetchPaymentStatus,
    refetchSession,
  ]);

  const handleCheckPaymentNow = async () => {
    const result = await refetchPaymentStatus();

    if (result.error) {
      showError(result.error);
      return;
    }

    if (result.data?.status === "APPROVED") {
      handleApproved(result.data.expiresAt);
    }
  };

  const handleGenerateNewPix = () => {
    void clearPendingCheckout();
    router.replace("/(paywall)/plans");
  };

  const displayStatus: BillingRuntimeStatus =
    isApproved ? "APPROVED" : paymentRuntimeStatus ?? "PENDING";

  const planName = checkout?.planName ?? paymentStatus?.planName ?? "Plano";
  const amount = checkout?.amount ?? paymentStatus?.amount ?? 0;
  const pixExpiresAt =
    checkout?.pixExpiresAt ?? paymentStatus?.pixExpiresAt ?? null;
  const isTerminalFailure =
    displayStatus === "EXPIRED" ||
    displayStatus === "CANCELLED" ||
    displayStatus === "REJECTED";

  const shouldShowLoading =
    isCreating ||
    isHydratingCheckout ||
    (!checkout &&
      !paymentStatus &&
      !!paymentId &&
      isLoadingPaymentStatus &&
      !isPaymentStatusError);

  const canRenderCheckout = Boolean(checkout || paymentStatus);

  const helperSteps = useMemo(
    () => [
      "Copie o código PIX e vá para o banco de preferência.",
      "Depois do pagamento, volte para este app.",
      "Se a confirmação já tiver acontecido, o app se atualiza ao retornar.",
    ],
    [],
  );

  if (shouldShowLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#f43f5e" />
          <Text className="mt-4 text-center text-base text-zinc-500">
            Preparando seu pagamento PIX...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canRenderCheckout) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full rounded-[28px] border border-rose-100 bg-white p-6">
            <Text className="text-xl font-bold text-zinc-900">
              Não foi possível abrir esse pagamento
            </Text>
            <Text className="mt-3 text-sm leading-6 text-zinc-500">
              Talvez esse PIX já tenha expirado ou o app não tenha conseguido
              restaurar o estado anterior.
            </Text>
            <Pressable
              onPress={handleGenerateNewPix}
              className="mt-6 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                Gerar novo PIX
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Feather name="arrow-left" size={20} color="#18181b" />
          </Pressable>

          <View className="items-center">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
              Checkout
            </Text>
            <Text className="mt-1 text-lg font-bold text-zinc-900">
              Pagamento PIX
            </Text>
          </View>

          <View className="h-11 w-11" />
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32,
            gap: 16,
          }}
        >
          <View className="rounded-[30px] border border-rose-100 bg-white p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
              Resumo do plano
            </Text>

            <View className="mt-3 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-2xl font-black text-zinc-900">
                  {planName}
                </Text>
              </View>

              <View className="rounded-[24px] bg-[#fff4f7] px-4 py-3">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-rose-400">
                  Total
                </Text>
                <Text className="mt-1 text-xl font-bold text-zinc-900">
                  {formatPrice(amount)}
                </Text>
              </View>
            </View>
          </View>

          <PixQrDisplay
            pixQrCode={checkout?.pixQrCode ?? null}
            pixQrCodeBase64={checkout?.pixQrCodeBase64 ?? null}
            pixExpiresAt={pixExpiresAt}
            paymentStatus={displayStatus}
            hasCopiedCode={hasCopiedCode}
            onCopySuccess={() => setHasCopiedCode(true)}
            onRegenerate={handleGenerateNewPix}
          />

          <View className="rounded-[30px] border border-rose-100 bg-white p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
              Como funciona
            </Text>

            <View className="mt-4 gap-3">
              {helperSteps.map((step, index) => (
                <View key={step} className="flex-row gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-rose-50">
                    <Text className="text-xs font-bold text-rose-500">
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 text-sm leading-6 text-zinc-600">
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <PaymentStatusIndicator
            status={displayStatus}
            hasCopiedCode={hasCopiedCode}
            isRefreshing={isCheckingPaymentStatus}
          />

          {displayStatus === "PENDING" ? (
            <Pressable
              onPress={() => {
                void handleCheckPaymentNow();
              }}
              className="items-center rounded-[26px] bg-zinc-900 py-4 active:opacity-85"
            >
              <Text className="text-base font-bold text-white">
                Voltei do banco, conferir pagamento
              </Text>
            </Pressable>
          ) : null}

          {isTerminalFailure ? (
            <Pressable
              onPress={handleGenerateNewPix}
              className="items-center rounded-[26px] bg-rose-500 py-4 active:opacity-85"
            >
              <Text className="text-base font-bold text-white">
                Gerar novo PIX
              </Text>
            </Pressable>
          ) : null}

          {isPaymentStatusError ? (
            <View className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <Text className="text-sm leading-6 text-amber-700">
                Não conseguimos verificar o status agora. Tente novamente depois
                de voltar do banco.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          className="border-t border-rose-100 bg-white px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleGenerateNewPix}
            className="items-center rounded-2xl bg-[#fff4f7] py-3.5 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-rose-500">
              Escolher outro plano
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

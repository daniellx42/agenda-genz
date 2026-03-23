import {
  appointmentClientHistoryInfiniteQueryOptions,
} from "@/features/appointments/api/appointment-query-options";
import { AppointmentCard } from "@/features/appointments/components/appointment-card";
import { AppointmentCardSkeleton } from "@/features/appointments/components/appointment-card-skeleton";
import { formatAppointmentShortDate } from "@/features/appointments/lib/appointment-date";
import type {
  AppointmentHistorySummary,
  AppointmentListItem,
} from "@/features/appointments/types";
import { SkeletonBox } from "@/components/ui/skeleton-box";
import { formatPrice } from "@/features/services/lib/service-formatters";
import { useApiError } from "@/hooks/use-api-error";
import { formatPhone } from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clientDetailQueryOptions } from "../api/client-query-options";
import { ClientAvatar } from "../components/client-avatar";

function SummaryMetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      className="rounded-2xl border border-rose-100 bg-white p-4"
      style={{ width: "48%" }}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-zinc-400">
        {label}
      </Text>
      <Text className="mt-2 text-2xl font-bold text-zinc-900">{value}</Text>
    </View>
  );
}

function FinancialSummaryCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  accent: "received" | "pending";
}) {
  const accentClasses =
    accent === "received"
      ? {
          card: "border-emerald-100 bg-emerald-50",
          value: "text-emerald-700",
          icon: "bg-emerald-100 text-emerald-700",
          text: "text-emerald-800",
        }
      : {
          card: "border-amber-100 bg-amber-50",
          value: "text-amber-700",
          icon: "bg-amber-100 text-amber-700",
          text: "text-amber-800",
        };

  return (
    <View className={`mb-4 rounded-[28px] border p-5 ${accentClasses.card}`}>
      <Text className="text-lg font-bold text-zinc-900">{title}</Text>
      <Text className={`mt-3 text-4xl font-black ${accentClasses.value}`}>{value}</Text>

      <View className="mt-4 flex-row items-start gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${accentClasses.icon}`}
        >
          <Feather name="info" size={16} />
        </View>
        <Text className={`flex-1 text-sm leading-6 ${accentClasses.text}`}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function DateInfoRow({
  label,
  value,
  hideBorder = false,
}: {
  label: string;
  value: string | null;
  hideBorder?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between gap-3 py-3"
      style={{
        borderBottomWidth: hideBorder ? 0 : 1,
        borderBottomColor: "#f4f4f5",
        paddingTop: 0,
        paddingBottom: hideBorder ? 0 : 12,
      }}
    >
      <Text className="text-sm text-zinc-500">{label}</Text>
      <Text className="text-sm font-semibold text-zinc-900">
        {value ? formatAppointmentShortDate(value) : "Sem registro"}
      </Text>
    </View>
  );
}

function buildSummaryMetrics(summary: AppointmentHistorySummary) {
  return [
    { label: "Total", value: summary.totalAppointments },
    { label: "Concluídos", value: summary.completedAppointments },
    { label: "Confirmados", value: summary.confirmedAppointments },
    { label: "Pendentes", value: summary.pendingAppointments },
    { label: "Cancelados", value: summary.cancelledAppointments },
    { label: "Pagos", value: summary.fullyPaidAppointments },
    { label: "Em aberto", value: summary.pendingPaymentAppointments },
  ] as const;
}

function ClientAppointmentsLoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
        <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View className="flex-1">
          <SkeletonBox style={{ width: 180, height: 18 }} />
          <SkeletonBox style={{ marginTop: 6, width: 220, height: 12 }} />
        </View>
      </View>

      <View className="px-5">
        {/* Card do cliente */}
        <View className="mb-4 flex-row items-center gap-4 rounded-2xl border border-rose-100 bg-white p-4">
          <SkeletonBox style={{ width: 56, height: 56, borderRadius: 28 }} />
          <View className="flex-1">
            <SkeletonBox style={{ width: "55%", height: 16 }} />
            <SkeletonBox style={{ marginTop: 8, width: "40%", height: 13 }} />
          </View>
          <SkeletonBox style={{ width: 88, height: 28, borderRadius: 20 }} />
        </View>

        {/* FinancialSummaryCard — recebido */}
        <View className="mb-4 rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
          <SkeletonBox style={{ width: 140, height: 16 }} />
          <SkeletonBox style={{ marginTop: 12, width: 160, height: 36 }} />
          <SkeletonBox style={{ marginTop: 16, width: "100%", height: 56 }} />
        </View>

        {/* FinancialSummaryCard — pendente */}
        <View className="mb-4 rounded-[28px] border border-amber-100 bg-amber-50 p-5">
          <SkeletonBox style={{ width: 160, height: 16 }} />
          <SkeletonBox style={{ marginTop: 12, width: 140, height: 36 }} />
          <SkeletonBox style={{ marginTop: 16, width: "100%", height: 56 }} />
        </View>

        {/* Card de datas úteis */}
        <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
          <SkeletonBox style={{ width: 100, height: 12 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              className="flex-row items-center justify-between py-3"
              style={{ borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: "#f4f4f5" }}
            >
              <SkeletonBox style={{ width: 140, height: 13 }} />
              <SkeletonBox style={{ width: 90, height: 13 }} />
            </View>
          ))}
        </View>

        {/* Grid de métricas */}
        <View className="mb-4 flex-row flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className="rounded-2xl border border-rose-100 bg-white p-4"
              style={{ width: "48%" }}
            >
              <SkeletonBox style={{ width: 80, height: 12 }} />
              <SkeletonBox style={{ marginTop: 12, width: 48, height: 28 }} />
            </View>
          ))}
        </View>

        {/* Lista de agendamentos */}
        {Array.from({ length: 3 }).map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </View>
    </SafeAreaView>
  );
}

function ClientAppointmentsEmptyState() {
  return (
    <View className="items-center rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-rose-100">
        <Feather name="calendar" size={24} color="#f43f5e" />
      </View>
      <Text className="text-base font-semibold text-zinc-900">
        Nenhum agendamento encontrado
      </Text>
      <Text className="mt-2 text-center text-sm leading-6 text-zinc-500">
        Quando este cliente tiver agendamentos, o histórico completo vai aparecer
        aqui com gastos, pagamentos e detalhes.
      </Text>
    </View>
  );
}

export default function ClientAppointmentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showError } = useApiError();
  const clientId = id ?? null;

  const { data: client, isLoading: isLoadingClient } = useQuery(
    clientDetailQueryOptions(clientId, showError),
  );

  const { imageUrl: profileImageUrl } = useResolvedImage({
    imageKey: client?.profileImageKey,
    handleError: showError,
  });

  const {
    data,
    isLoading: isLoadingHistory,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    appointmentClientHistoryInfiniteQueryOptions(clientId, showError),
  );

  const historyPages = data?.pages ?? [];
  const history = historyPages.flatMap((page) => page.data);
  const firstPage = historyPages[0];
  const summary = firstPage?.summary;
  const totalAppointments = firstPage?.pagination.total ?? 0;
  const summaryMetrics = summary ? buildSummaryMetrics(summary) : [];

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (clientId === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
          >
            <Feather name="arrow-left" size={18} color="#3f3f46" />
          </Pressable>
          <Text className="text-lg font-bold text-zinc-900">
            Histórico do cliente
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-sm text-zinc-500">
            Cliente inválido para carregar o histórico.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingClient || isLoadingHistory) {
    return <ClientAppointmentsLoadingScreen />;
  }

  if (!client || !summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
          >
            <Feather name="arrow-left" size={18} color="#3f3f46" />
          </Pressable>
          <Text className="text-lg font-bold text-zinc-900">
            Histórico do cliente
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-sm text-zinc-500">
            Não foi possível carregar o histórico deste cliente agora.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <Feather name="arrow-left" size={18} color="#3f3f46" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-zinc-900">
            Histórico do cliente
          </Text>
          <Text className="text-xs text-zinc-400">
            Resumo financeiro e agendamentos
          </Text>
        </View>
      </View>

      <FlatList<AppointmentListItem>
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={{
              id: item.id,
              status: item.status,
              paymentStatus: item.paymentStatus,
              dateLabel: formatAppointmentShortDate(item.date),
              client: {
                name: item.client.name,
                phone: item.client.phone,
              },
              service: {
                name: item.service.name,
                price: item.service.price,
                depositPercentage: item.service.depositPercentage,
                imageKey: item.service.imageKey,
                color: item.service.color,
              },
              timeSlot: {
                time: item.timeSlot.time,
              },
            }}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={() => {
          void refetch();
        }}
        ListHeaderComponent={
          <View>
            <View className="mb-4 flex-row items-center gap-4 rounded-2xl border border-rose-100 bg-white p-4">
              <ClientAvatar
                name={client.name}
                imageUrl={profileImageUrl}
                imageCacheKey={client.profileImageKey}
                size={56}
              />
              <View className="flex-1">
                <Text className="text-base font-bold text-zinc-900">
                  {client.name}
                </Text>
                <Text className="mt-1 text-sm text-zinc-500">
                  {formatPhone(client.phone)}
                </Text>
              </View>
              <View className="rounded-full bg-rose-50 px-3 py-2">
                <Text className="text-xs font-semibold text-rose-500">
                  {totalAppointments} no histórico
                </Text>
              </View>
            </View>

            <FinancialSummaryCard
              title="Total já recebido"
              value={formatPrice(summary.totalReceivedCents)}
              description="Soma do que já entrou em caixa com pagamentos quitados e sinais já recebidos."
              accent="received"
            />

            <FinancialSummaryCard
              title="Pendente a receber"
              value={formatPrice(summary.totalPendingAmountCents)}
              description="Este valor soma pagamentos em aberto e o restante de agendamentos com sinal pago."
              accent="pending"
            />

            <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-zinc-400">
                Datas úteis
              </Text>
              <View className="mt-2">
                <DateInfoRow
                  label="Primeiro agendamento"
                  value={summary.firstAppointmentDate}
                />
                <DateInfoRow
                  label="Último agendamento"
                  value={summary.lastAppointmentDate}
                />
                <DateInfoRow
                  label="Próximo agendamento"
                  value={summary.nextAppointmentDate}
                />
                <DateInfoRow
                  label="Último concluído"
                  value={summary.lastCompletedAppointmentDate}
                  hideBorder
                />
              </View>
            </View>

            <View className="mb-4 flex-row flex-wrap gap-3">
              {summaryMetrics.map((metric) => (
                <SummaryMetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-lg font-bold text-zinc-900">
                  Lista de agendamentos
                </Text>
                <Text className="mt-1 text-sm text-zinc-500">
                  Toque em um item para abrir os detalhes completos.
                </Text>
              </View>
              <View className="rounded-full bg-white px-3 py-2">
                <Text className="text-xs font-semibold text-zinc-700">
                  {totalAppointments} total
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={<ClientAppointmentsEmptyState />}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#f43f5e" style={{ marginTop: 12 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

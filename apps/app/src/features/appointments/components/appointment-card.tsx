import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  APPOINTMENT_SERVICE_STATUS_CONFIG,
  type AppointmentPaymentStatus,
  type AppointmentServiceStatus,
} from "../constants/appointment-status";
import {
  getAppointmentDepositAmountCents,
  getAppointmentRemainingAmountCents,
} from "../lib/appointment-financials";
import { useAppointmentStatusActions } from "../hooks/use-appointment-status-actions";
import { AppointmentStatusActionButton } from "./appointment-status-action-button";
import { AppointmentStatusSelectionSheet } from "./appointment-status-selection-sheet";

export interface AppointmentCardData {
  id: string;
  status: string;
  paymentStatus: string;
  dateLabel?: string;
  client: { name: string; phone: string };
  service: { name: string; price: number; depositPercentage: number | null; emoji: string | null };
  timeSlot: { time: string };
}

interface AppointmentCardProps {
  appointment: AppointmentCardData;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();
  const serviceStatus = (
    appointment.status in APPOINTMENT_SERVICE_STATUS_CONFIG
      ? appointment.status
      : "PENDING"
  ) as AppointmentServiceStatus;
  const paymentStatus = (
    appointment.paymentStatus === "PAID"
      ? "PAID"
      : appointment.paymentStatus === "DEPOSIT_PAID"
        ? "DEPOSIT_PAID"
        : "PENDING"
  ) as AppointmentPaymentStatus;

  const {
    paymentSheetRef,
    serviceSheetRef,
    openPaymentSheet,
    openServiceSheet,
    selectPaymentStatus,
    selectServiceStatus,
    updatingPaymentStatus,
    updatingServiceStatus,
    isUpdatingPayment,
    isUpdatingService,
  } = useAppointmentStatusActions({
    appointmentId: appointment.id,
    paymentStatus,
    serviceStatus,
  });

  const serviceStatusConfig =
    APPOINTMENT_SERVICE_STATUS_CONFIG[serviceStatus] ??
    APPOINTMENT_SERVICE_STATUS_CONFIG.PENDING;
  const paymentStatusConfig =
    APPOINTMENT_PAYMENT_STATUS_CONFIG[paymentStatus] ??
    APPOINTMENT_PAYMENT_STATUS_CONFIG.PENDING;
  const depositAmount = getAppointmentDepositAmountCents(
    appointment.service.price,
    appointment.service.depositPercentage,
  );
  const remainingAmount = getAppointmentRemainingAmountCents(
    appointment.service.price,
    appointment.service.depositPercentage,
  );

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-rose-100 bg-white">
      <Pressable
        onPress={() => router.push(`/appointment/${appointment.id}` as never)}
        className="p-4 active:opacity-80"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
              <Text className="text-2xl">{appointment.service.emoji ?? "✨"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-zinc-900" numberOfLines={1}>
                {appointment.service.name}
              </Text>
              <Text className="mt-0.5 text-xs text-zinc-400">
                {appointment.client.name}
              </Text>
              <Text className="mt-1 text-xs text-zinc-500">
                Toque para abrir os detalhes
              </Text>
            </View>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50">
            <Text className="text-lg text-rose-500">›</Text>
          </View>
        </View>
      </Pressable>

      <View className="border-t border-rose-100 px-4 py-3">
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          {appointment.dateLabel ? (
            <Text className="text-xs text-zinc-500">📅 {appointment.dateLabel}</Text>
          ) : null}
          <Text className="text-xs text-zinc-500">🕐 {appointment.timeSlot.time}</Text>
          <Text className="text-xs text-zinc-500">
            💵 R$ {(appointment.service.price / 100).toFixed(2)}
          </Text>
          {depositAmount !== null && remainingAmount !== null && (
            <>
              <Text className="text-xs text-blue-500">
                💰 Sinal: R$ {(depositAmount / 100).toFixed(2)}
              </Text>
              <Text className="text-xs text-zinc-400">
                Restante: R$ {(remainingAmount / 100).toFixed(2)}
              </Text>
            </>
          )}
        </View>

        <View className="mt-3 flex-row gap-2">
          <AppointmentStatusActionButton
            title="Pagamento"
            config={paymentStatusConfig}
            loading={isUpdatingPayment}
            onPress={openPaymentSheet}
          />
          <AppointmentStatusActionButton
            title="Serviço"
            config={serviceStatusConfig}
            loading={isUpdatingService}
            onPress={openServiceSheet}
          />
        </View>
      </View>

      <AppointmentStatusSelectionSheet
        kind="payment"
        sheetRef={paymentSheetRef}
        onSelect={selectPaymentStatus}
        currentStatus={paymentStatus}
        updatingStatus={updatingPaymentStatus}
      />

      <AppointmentStatusSelectionSheet
        kind="service"
        sheetRef={serviceSheetRef}
        onSelect={selectServiceStatus}
        currentStatus={serviceStatus}
        updatingStatus={updatingServiceStatus}
      />
    </View>
  );
}

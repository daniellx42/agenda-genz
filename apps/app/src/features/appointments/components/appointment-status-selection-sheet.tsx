import { SelectionSheet } from "@/components/ui/selection-sheet";
import {
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  APPOINTMENT_PAYMENT_STATUS_OPTIONS,
  APPOINTMENT_SERVICE_STATUS_CONFIG,
  APPOINTMENT_SERVICE_STATUS_OPTIONS,
  type AppointmentPaymentStatus,
  type AppointmentServiceStatus,
} from "../constants/appointment-status";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

const SERVICE_STATUS_ICONS: Record<AppointmentServiceStatus, string> = {
  PENDING: "⏳",
  CONFIRMED: "✅",
  COMPLETED: "✨",
  CANCELLED: "⛔",
};

const PAYMENT_STATUS_ICONS: Record<AppointmentPaymentStatus, string> = {
  PENDING: "🕒",
  DEPOSIT_PAID: "💰",
  PAID: "💳",
};

interface AppointmentServiceStatusSelectionSheetProps {
  kind: "service";
  sheetRef: React.RefObject<BottomSheetModal | null>;
  currentStatus: AppointmentServiceStatus;
  updatingStatus: AppointmentServiceStatus | null;
  onSelect: (status: AppointmentServiceStatus) => void;
}

interface AppointmentPaymentStatusSelectionSheetProps {
  kind: "payment";
  sheetRef: React.RefObject<BottomSheetModal | null>;
  currentStatus: AppointmentPaymentStatus;
  updatingStatus: AppointmentPaymentStatus | null;
  onSelect: (status: AppointmentPaymentStatus) => void;
}

export function AppointmentStatusSelectionSheet(
  props:
    | AppointmentServiceStatusSelectionSheetProps
    | AppointmentPaymentStatusSelectionSheetProps,
) {
  if (props.kind === "payment") {
    return (
      <SelectionSheet
        sheetRef={props.sheetRef}
        title="Status do pagamento"
        description="Escolha como este agendamento deve aparecer no financeiro."
        onSelect={props.onSelect}
        options={APPOINTMENT_PAYMENT_STATUS_OPTIONS.map((status) => ({
          value: status,
          title: APPOINTMENT_PAYMENT_STATUS_CONFIG[status].label,
          description:
            status === "PAID"
              ? "Valor total recebido."
              : status === "DEPOSIT_PAID"
                ? "Sinal recebido, restante a pagar no dia."
                : "Pagamento ainda nao foi concluido.",
          icon: PAYMENT_STATUS_ICONS[status],
          selected: props.currentStatus === status,
          loading: props.updatingStatus === status,
          disabled:
            props.updatingStatus !== null && props.updatingStatus !== status,
        }))}
      />
    );
  }

  return (
    <SelectionSheet
      sheetRef={props.sheetRef}
      title="Status do serviço"
      description="Atualize o andamento do atendimento sem sair da agenda."
      onSelect={props.onSelect}
      options={APPOINTMENT_SERVICE_STATUS_OPTIONS.map((status) => ({
        value: status,
        title: APPOINTMENT_SERVICE_STATUS_CONFIG[status].label,
        description:
          status === "PENDING"
            ? "Agendamento criado, aguardando confirmacao."
            : status === "CONFIRMED"
              ? "Cliente confirmado para o horario."
              : status === "COMPLETED"
                ? "Atendimento finalizado com sucesso."
                : "Atendimento cancelado ou nao realizado.",
        icon: SERVICE_STATUS_ICONS[status],
        selected: props.currentStatus === status,
        loading: props.updatingStatus === status,
        disabled: props.updatingStatus !== null && props.updatingStatus !== status,
      }))}
    />
  );
}

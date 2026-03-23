import { SelectionSheet } from "@/components/ui/selection-sheet";
import Feather from "@expo/vector-icons/Feather";
import {
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  APPOINTMENT_PAYMENT_STATUS_OPTIONS,
  APPOINTMENT_SERVICE_STATUS_CONFIG,
  APPOINTMENT_SERVICE_STATUS_OPTIONS,
  type AppointmentPaymentStatus,
  type AppointmentServiceStatus,
} from "../constants/appointment-status";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

function getServiceStatusIcon(status: AppointmentServiceStatus) {
  if (status === "CONFIRMED") {
    return <Feather name="check-circle" size={18} color="#16a34a" />;
  }

  if (status === "COMPLETED") {
    return <Feather name="star" size={18} color="#f59e0b" />;
  }

  if (status === "CANCELLED") {
    return <Feather name="slash" size={18} color="#ef4444" />;
  }

  return <Feather name="clock" size={18} color="#f97316" />;
}

function getPaymentStatusIcon(status: AppointmentPaymentStatus) {
  if (status === "DEPOSIT_PAID") {
    return <Feather name="credit-card" size={18} color="#2563eb" />;
  }

  if (status === "PAID") {
    return <Feather name="dollar-sign" size={18} color="#16a34a" />;
  }

  return <Feather name="clock" size={18} color="#f97316" />;
}

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
                : "Pagamento ainda não foi concluído.",
          icon: getPaymentStatusIcon(status),
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
            ? "Agendamento criado, aguardando confirmação."
            : status === "CONFIRMED"
              ? "Cliente confirmado para o horário."
              : status === "COMPLETED"
                ? "Atendimento finalizado com sucesso."
                : "Atendimento cancelado ou não realizado.",
        icon: getServiceStatusIcon(status),
        selected: props.currentStatus === status,
        loading: props.updatingStatus === status,
        disabled: props.updatingStatus !== null && props.updatingStatus !== status,
      }))}
    />
  );
}

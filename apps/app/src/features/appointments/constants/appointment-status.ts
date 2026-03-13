export type AppointmentServiceStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type AppointmentPaymentStatus = "PENDING" | "DEPOSIT_PAID" | "PAID";

export interface AppointmentStatusConfig {
  label: string;
  bg: string;
  text: string;
}

export const APPOINTMENT_SERVICE_STATUS_CONFIG: Record<
  AppointmentServiceStatus,
  AppointmentStatusConfig
> = {
  PENDING: {
    label: "Pendente",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  CONFIRMED: {
    label: "Confirmado",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  COMPLETED: {
    label: "Concluído",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelado",
    bg: "bg-red-100",
    text: "text-red-400",
  },
};

export const APPOINTMENT_PAYMENT_STATUS_CONFIG: Record<
  AppointmentPaymentStatus,
  AppointmentStatusConfig
> = {
  PENDING: {
    label: "Pendente",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  DEPOSIT_PAID: {
    label: "Sinal pago",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  PAID: {
    label: "Pago tudo",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
};

export const APPOINTMENT_SERVICE_STATUS_OPTIONS: AppointmentServiceStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

export const APPOINTMENT_PAYMENT_STATUS_OPTIONS: AppointmentPaymentStatus[] = [
  "PENDING",
  "DEPOSIT_PAID",
  "PAID",
];

export const APPOINTMENT_STATUS_CONFIG = APPOINTMENT_SERVICE_STATUS_CONFIG;

import { normalizeWhitespace } from "@/lib/formatters";
import {
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  APPOINTMENT_SERVICE_STATUS_CONFIG,
  type AppointmentPaymentStatus,
  type AppointmentServiceStatus,
} from "../constants/appointment-status";
import {
  formatAppointmentDate,
  normalizeAppointmentDateOnly,
} from "./appointment-date";
import { formatAppointmentTimeWithPeriod } from "./appointment-time";

interface AppointmentShareMessageInput {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  serviceStatus: AppointmentServiceStatus;
  paymentStatus: AppointmentPaymentStatus;
  notes?: string | null;
}

const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MINUTES = 60;
const DAY_IN_HOURS = 24;

function getClientDisplayName(name: string) {
  return normalizeWhitespace(name) || "cliente";
}

function parseAppointmentDateTime(date: string, time: string): Date | null {
  const normalizedDate = normalizeAppointmentDateOnly(date);

  if (!normalizedDate || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (
    [year, month, day, hours, minutes].some((value) => Number.isNaN(value))
  ) {
    return null;
  }

  const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (Number.isNaN(appointmentDate.getTime())) {
    return null;
  }

  return appointmentDate;
}

function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatHoursAndMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / HOUR_IN_MINUTES);
  const minutes = totalMinutes % HOUR_IN_MINUTES;

  return `${hours}:${String(minutes).padStart(2, "0")} horas`;
}

function getRemainingAppointmentMinutes(
  input: Pick<AppointmentShareMessageInput, "date" | "time">,
  now = new Date(),
) {
  const appointmentDate = parseAppointmentDateTime(input.date, input.time);

  if (!appointmentDate) {
    return null;
  }

  const diffMs = appointmentDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(diffMs / MINUTE_IN_MS));
}

export function getAppointmentCountdownLabel(
  input: Pick<AppointmentShareMessageInput, "date" | "time">,
  now = new Date(),
) {
  const totalMinutes = getRemainingAppointmentMinutes(input, now);

  if (totalMinutes === null) {
    return null;
  }

  const totalHours = Math.floor(totalMinutes / HOUR_IN_MINUTES);
  const days = Math.floor(totalHours / DAY_IN_HOURS);
  const hours = totalHours % DAY_IN_HOURS;
  const minutes = totalMinutes % HOUR_IN_MINUTES;

  if (days > 0) {
    return hours > 0
      ? `${pluralize(days, "dia", "dias")} e ${pluralize(hours, "hora", "horas")}`
      : pluralize(days, "dia", "dias");
  }

  if (totalHours > 0) {
    if (minutes > 0 && totalHours <= 3) {
      return `${pluralize(totalHours, "hora", "horas")} e ${pluralize(minutes, "minuto", "minutos")}`;
    }

    return pluralize(totalHours, "hora", "horas");
  }

  return pluralize(totalMinutes, "minuto", "minutos");
}

export function getAppointmentReminderCountdownLabel(
  input: Pick<AppointmentShareMessageInput, "date" | "time">,
  now = new Date(),
) {
  const totalMinutes = getRemainingAppointmentMinutes(input, now);

  if (totalMinutes === null) {
    return null;
  }

  const minutesPerDay = DAY_IN_HOURS * HOUR_IN_MINUTES;
  const days = Math.floor(totalMinutes / minutesPerDay);
  const remainingMinutes = totalMinutes - days * minutesPerDay;

  if (days > 0) {
    return `${pluralize(days, "dia", "dias")}, ${formatHoursAndMinutes(remainingMinutes)}`;
  }

  return formatHoursAndMinutes(totalMinutes);
}

function buildAppointmentSummaryLines(input: AppointmentShareMessageInput) {
  const serviceStatusLabel =
    APPOINTMENT_SERVICE_STATUS_CONFIG[input.serviceStatus].label;
  const paymentStatusLabel =
    APPOINTMENT_PAYMENT_STATUS_CONFIG[input.paymentStatus].label;
  const notes = normalizeWhitespace(input.notes ?? "");

  return [
    `Serviço: ${input.serviceName}`,
    `Data: ${formatAppointmentDate(input.date)}`,
    `Horário: ${formatAppointmentTimeWithPeriod(input.time)}`,
    `Status do agendamento: ${serviceStatusLabel}`,
    `Status do pagamento: ${paymentStatusLabel}`,
    ...(notes ? [`Observações: ${notes}`] : []),
  ];
}

export function buildAppointmentConfirmationMessage(
  input: AppointmentShareMessageInput,
) {
  const clientDisplayName = getClientDisplayName(input.clientName);

  return [
    `Olá ${clientDisplayName}, esta é uma mensagem automática do nosso sistema para confirmar o seu agendamento.`,
    "",
    ...buildAppointmentSummaryLines(input),
    "",
    "Se precisar ajustar alguma informação, responda esta mensagem.",
  ].join("\n");
}

export function buildAppointmentReminderMessage(
  input: AppointmentShareMessageInput,
  now = new Date(),
) {
  const clientDisplayName = getClientDisplayName(input.clientName);
  const countdownLabel = getAppointmentReminderCountdownLabel(input, now);

  return [
    `Olá ${clientDisplayName}, esta é uma mensagem automática do nosso sistema para lembrar que o seu atendimento está próximo.`,
    "",
    countdownLabel
      ? `Seu atendimento está agendado para daqui ${countdownLabel}, não se esqueça ❤️`
      : "Seu atendimento está agendado para acontecer em breve.",
    "",
    ...buildAppointmentSummaryLines(input),
    "",
    "Estamos te esperando.",
  ].join("\n");
}

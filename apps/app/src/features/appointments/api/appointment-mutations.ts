import { api } from "@/lib/api";
import {
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";
import type {
  AppointmentPaymentStatus,
  AppointmentServiceStatus,
} from "../constants/appointment-status";

export async function createAppointment(
  input: {
    clientId: string;
    serviceId: string;
    timeSlotId: string;
    date: string;
    notes?: string;
  },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.appointments.post(input);
  throwIfApiError(error, handleError);
}

export async function updateAppointmentPayment(
  input: { id: string; paymentStatus: AppointmentPaymentStatus },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.appointments({ id: input.id }).payment.patch({
    paymentStatus: input.paymentStatus,
  });

  throwIfApiError(error, handleError);
}

export async function updateAppointmentStatus(
  input: { id: string; status: AppointmentServiceStatus },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.appointments({ id: input.id }).status.patch({
    status: input.status,
  });

  throwIfApiError(error, handleError);
}

export async function updateAppointmentImage(
  input: {
    id: string;
    imageField: "beforeImageKey" | "afterImageKey";
    imageKey: string;
  },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.appointments({ id: input.id }).images.patch({
    [input.imageField]: input.imageKey,
  });

  throwIfApiError(error, handleError);
}

export async function deleteAppointmentImage(
  input: { id: string; slot: "before" | "after" },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.appointments({ id: input.id }).images({
    slot: input.slot,
  }).delete();

  throwIfApiError(error, handleError);
}

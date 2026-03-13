import { formatDateOnly } from "../../../shared/lib/date-only";

export interface AppointmentHistorySummaryInput {
  date: Date;
  status: string;
  paymentStatus: string;
  service: {
    price: number;
    depositPercentage: number | null;
  };
}

export function getAppointmentPaidAmountInCents(
  price: number,
  depositPercentage: number | null,
  paymentStatus: string,
): number {
  if (paymentStatus === "PAID") {
    return price;
  }

  if (paymentStatus === "DEPOSIT_PAID") {
    if (depositPercentage === null) {
      return price;
    }

    return Math.round(price * depositPercentage / 100);
  }

  return 0;
}

export function buildAppointmentHistorySummary(
  rows: AppointmentHistorySummaryInput[],
  today = formatDateOnly(new Date()),
) {
  let completedAppointments = 0;
  let confirmedAppointments = 0;
  let pendingAppointments = 0;
  let cancelledAppointments = 0;
  let fullyPaidAppointments = 0;
  let pendingPaymentAppointments = 0;
  let totalReceivedCents = 0;
  let totalPendingAmountCents = 0;
  let totalBookedCents = 0;
  let firstAppointmentDate: string | null = null;
  let lastAppointmentDate: string | null = null;
  let nextAppointmentDate: string | null = null;
  let lastCompletedAppointmentDate: string | null = null;

  for (const row of rows) {
    const appointmentDate = formatDateOnly(row.date);

    if (firstAppointmentDate === null || appointmentDate < firstAppointmentDate) {
      firstAppointmentDate = appointmentDate;
    }

    if (lastAppointmentDate === null || appointmentDate > lastAppointmentDate) {
      lastAppointmentDate = appointmentDate;
    }

    if (
      row.status !== "CANCELLED" &&
      appointmentDate >= today &&
      (nextAppointmentDate === null || appointmentDate < nextAppointmentDate)
    ) {
      nextAppointmentDate = appointmentDate;
    }

    if (
      row.status === "COMPLETED" &&
      (lastCompletedAppointmentDate === null ||
        appointmentDate > lastCompletedAppointmentDate)
    ) {
      lastCompletedAppointmentDate = appointmentDate;
    }

    if (row.status === "COMPLETED") completedAppointments += 1;
    if (row.status === "CONFIRMED") confirmedAppointments += 1;
    if (row.status === "PENDING") pendingAppointments += 1;
    if (row.status === "CANCELLED") cancelledAppointments += 1;

    if (row.paymentStatus === "PAID") {
      fullyPaidAppointments += 1;
    } else if (row.status !== "CANCELLED") {
      pendingPaymentAppointments += 1;
    }

    const paidAmount = getAppointmentPaidAmountInCents(
      row.service.price,
      row.service.depositPercentage,
      row.paymentStatus,
    );

    if (row.status !== "CANCELLED") {
      totalPendingAmountCents += row.service.price - paidAmount;
    }

    totalBookedCents += row.service.price;
    totalReceivedCents += paidAmount;
  }

  return {
    totalAppointments: rows.length,
    completedAppointments,
    confirmedAppointments,
    pendingAppointments,
    cancelledAppointments,
    fullyPaidAppointments,
    pendingPaymentAppointments,
    totalReceivedCents,
    totalPendingAmountCents,
    totalBookedCents,
    firstAppointmentDate,
    lastAppointmentDate,
    nextAppointmentDate,
    lastCompletedAppointmentDate,
  };
}

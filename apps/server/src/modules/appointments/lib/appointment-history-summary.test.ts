import { describe, expect, it } from "bun:test";
import {
  buildAppointmentHistorySummary,
  getAppointmentPaidAmountInCents,
} from "./appointment-history-summary";

describe("appointment-history-summary", () => {
  it("calcula o valor pago corretamente para sinal, quitação e pendência", () => {
    expect(getAppointmentPaidAmountInCents(20000, 30, "PAID")).toBe(20000);
    expect(getAppointmentPaidAmountInCents(20000, 30, "DEPOSIT_PAID")).toBe(6000);
    expect(getAppointmentPaidAmountInCents(20000, null, "DEPOSIT_PAID")).toBe(20000);
    expect(getAppointmentPaidAmountInCents(20000, 30, "PENDING")).toBe(0);
  });

  it("monta o resumo do histórico com datas e contadores úteis", () => {
    const summary = buildAppointmentHistorySummary(
      [
        {
          date: new Date("2026-03-01T12:00:00.000Z"),
          status: "COMPLETED",
          paymentStatus: "PAID",
          service: {
            price: 15000,
            depositPercentage: 30,
          },
        },
        {
          date: new Date("2026-03-14T12:00:00.000Z"),
          status: "CONFIRMED",
          paymentStatus: "DEPOSIT_PAID",
          service: {
            price: 20000,
            depositPercentage: 25,
          },
        },
        {
          date: new Date("2026-03-15T12:00:00.000Z"),
          status: "CANCELLED",
          paymentStatus: "PENDING",
          service: {
            price: 18000,
            depositPercentage: null,
          },
        },
        {
          date: new Date("2026-03-16T12:00:00.000Z"),
          status: "PENDING",
          paymentStatus: "PENDING",
          service: {
            price: 12000,
            depositPercentage: 50,
          },
        },
      ],
      "2026-03-11",
    );

    expect(summary).toEqual({
      totalAppointments: 4,
      completedAppointments: 1,
      confirmedAppointments: 1,
      pendingAppointments: 1,
      cancelledAppointments: 1,
      fullyPaidAppointments: 1,
      pendingPaymentAppointments: 2,
      totalReceivedCents: 20000,
      totalPendingAmountCents: 27000,
      totalBookedCents: 65000,
      firstAppointmentDate: "2026-03-01",
      lastAppointmentDate: "2026-03-16",
      nextAppointmentDate: "2026-03-14",
      lastCompletedAppointmentDate: "2026-03-01",
    });
  });
});

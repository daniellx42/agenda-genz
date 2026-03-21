import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace AppointmentModel {
  const dateOnlyPattern = "^\\d{4}-\\d{2}-\\d{2}$";

  // ─── Query Params ────────────────────────────────────────────────────────────

  export const byDateQuery = t.Object({
    date: t.String({ pattern: dateOnlyPattern }), // "2026-03-10"
  });
  export type byDateQuery = typeof byDateQuery.static;

  export const calendarQuery = t.Object({
    year: t.String(),
    month: t.String(), // 1-12
  });
  export type calendarQuery = typeof calendarQuery.static;

  export const shareSlotsQuery = t.Object({
    from: t.String({ pattern: dateOnlyPattern }), // "2026-03-10"
    to: t.String({ pattern: dateOnlyPattern }),   // "2026-03-17"
  });
  export type shareSlotsQuery = typeof shareSlotsQuery.static;

  export const clientHistoryQuery = t.Object({
    page: t.Optional(t.String({ default: "1" })),
    limit: t.Optional(t.String({ default: "20" })),
  });
  export type clientHistoryQuery = typeof clientHistoryQuery.static;

  // ─── Params ──────────────────────────────────────────────────────────────────

  export const idParams = t.Object({
    id: t.String(),
  });
  export type idParams = typeof idParams.static;

  export const clientIdParams = t.Object({
    clientId: t.String(),
  });
  export type clientIdParams = typeof clientIdParams.static;

  export const imageSlotParams = t.Object({
    id: t.String(),
    slot: t.Union([t.Literal("before"), t.Literal("after")]),
  });
  export type imageSlotParams = typeof imageSlotParams.static;

  // ─── Body ────────────────────────────────────────────────────────────────────

  export const createBody = t.Object({
    clientId: t.String({ minLength: 1 }),
    serviceId: t.String({ minLength: 1 }),
    timeSlotId: t.String({ minLength: 1 }),
    date: t.String({ pattern: dateOnlyPattern }), // ISO date: "2026-03-10"
    notes: t.Optional(t.String({ maxLength: 500 })),
  });
  export type createBody = typeof createBody.static;

  export const updateStatusBody = t.Object({
    status: t.Union([
      t.Literal("PENDING"),
      t.Literal("CONFIRMED"),
      t.Literal("COMPLETED"),
      t.Literal("CANCELLED"),
    ]),
  });
  export type updateStatusBody = typeof updateStatusBody.static;

  export const updatePaymentBody = t.Object({
    paymentStatus: t.Union([
      t.Literal("PENDING"),
      t.Literal("DEPOSIT_PAID"),
      t.Literal("PAID"),
    ]),
  });
  export type updatePaymentBody = typeof updatePaymentBody.static;

  export const updateImagesBody = t.Object({
    beforeImageKey: t.Optional(t.Union([t.String(), t.Null()])),
    afterImageKey: t.Optional(t.Union([t.String(), t.Null()])),
  });
  export type updateImagesBody = typeof updateImagesBody.static;

  // ─── Responses ───────────────────────────────────────────────────────────────

  export const appointmentResponse = t.Object({
    id: t.String(),
    date: t.String(),
    status: t.String(),
    paymentStatus: t.String(),
    notes: t.Union([t.String(), t.Null()]),
    beforeImageKey: t.Union([t.String(), t.Null()]),
    afterImageKey: t.Union([t.String(), t.Null()]),
    client: t.Object({
      id: t.String(),
      name: t.String(),
      phone: t.String(),
      profileImageKey: t.Union([t.String(), t.Null()]),
    }),
    service: t.Object({
      id: t.String(),
      name: t.String(),
      price: t.Number(),
      depositPercentage: t.Union([t.Number(), t.Null()]),
      imageKey: t.String(),
      color: t.Union([t.String(), t.Null()]),
    }),
    timeSlot: t.Object({
      id: t.String(),
      time: t.String(),
    }),
    createdAt: t.String(),
    updatedAt: t.String(),
  });
  export type appointmentResponse = typeof appointmentResponse.static;

  export const listResponse = t.Array(appointmentResponse);
  export type listResponse = typeof listResponse.static;

  // Para o calendário: datas que têm agendamentos
  export const calendarResponse = t.Array(
    t.Object({
      date: t.String(), // "2026-03-10"
      count: t.Number(),
    }),
  );
  export type calendarResponse = typeof calendarResponse.static;

  export const clientHistorySummary = t.Object({
    totalAppointments: t.Number(),
    completedAppointments: t.Number(),
    confirmedAppointments: t.Number(),
    pendingAppointments: t.Number(),
    cancelledAppointments: t.Number(),
    fullyPaidAppointments: t.Number(),
    pendingPaymentAppointments: t.Number(),
    totalReceivedCents: t.Number(),
    totalPendingAmountCents: t.Number(),
    totalBookedCents: t.Number(),
    firstAppointmentDate: t.Union([t.String(), t.Null()]),
    lastAppointmentDate: t.Union([t.String(), t.Null()]),
    nextAppointmentDate: t.Union([t.String(), t.Null()]),
    lastCompletedAppointmentDate: t.Union([t.String(), t.Null()]),
  });
  export type clientHistorySummary = typeof clientHistorySummary.static;

  export const clientHistoryResponse = t.Object({
    data: listResponse,
    pagination: t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
      totalPages: t.Number(),
    }),
    summary: clientHistorySummary,
  });
  export type clientHistoryResponse = typeof clientHistoryResponse.static;

  // Para compartilhar: slots disponíveis por data
  export const shareSlotsResponse = t.Array(
    t.Object({
      date: t.String(),       // "2026-03-10"
      dayLabel: t.String(),   // "Segunda, 10/03"
      slots: t.Array(
        t.Object({
          time: t.String(),
          available: t.Boolean(),
        }),
      ),
    }),
  );
  export type shareSlotsResponse = typeof shareSlotsResponse.static;

  export const deleteResponse = t.Object({ success: t.Boolean() });
  export type deleteResponse = typeof deleteResponse.static;

  // ─── Errors ──────────────────────────────────────────────────────────────────

  export const errorNotFound = t.Literal(
    Errors.APPOINTMENT.NOT_FOUND.message,
  );
  export type errorNotFound = typeof errorNotFound.static;

  export const errorSlotUnavailable = t.Literal(
    Errors.APPOINTMENT.SLOT_UNAVAILABLE.message,
  );
  export type errorSlotUnavailable = typeof errorSlotUnavailable.static;

  export const errorInvalidDate = t.Literal(
    Errors.APPOINTMENT.INVALID_DATE.message,
  );
  export type errorInvalidDate = typeof errorInvalidDate.static;

  export const errorShareRangeTooLarge = t.Literal(
    Errors.APPOINTMENT.SHARE_RANGE_TOO_LARGE.message,
  );
  export type errorShareRangeTooLarge = typeof errorShareRangeTooLarge.static;

  export const errorImageNotFound = t.Literal(
    Errors.APPOINTMENT.IMAGE_NOT_FOUND.message,
  );
  export type errorImageNotFound = typeof errorImageNotFound.static;

  export const errorClientNotFound = t.Literal(Errors.CLIENT.NOT_FOUND.message);
  export type errorClientNotFound = typeof errorClientNotFound.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

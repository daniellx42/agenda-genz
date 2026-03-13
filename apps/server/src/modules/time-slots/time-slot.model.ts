import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace TimeSlotModel {
  const dateOnlyPattern = "^\\d{4}-\\d{2}-\\d{2}$";

  // ─── Query Params ────────────────────────────────────────────────────────────

  export const listQuery = t.Object({
    dayOfWeek: t.Optional(t.String()),
  });
  export type listQuery = typeof listQuery.static;

  export const availableQuery = t.Object({
    date: t.String({ pattern: dateOnlyPattern }), // ISO date: "2026-03-10"
  });
  export type availableQuery = typeof availableQuery.static;

  export const blockedDatesQuery = t.Object({
    from: t.Optional(t.String({ pattern: dateOnlyPattern })),
    to: t.Optional(t.String({ pattern: dateOnlyPattern })),
  });
  export type blockedDatesQuery = typeof blockedDatesQuery.static;

  // ─── Params ──────────────────────────────────────────────────────────────────

  export const idParams = t.Object({
    id: t.String(),
  });
  export type idParams = typeof idParams.static;

  // ─── Body ────────────────────────────────────────────────────────────────────

  export const createBody = t.Object({
    dayOfWeek: t.Integer({ minimum: 0, maximum: 6 }),
    time: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }), // HH:MM
  });
  export type createBody = typeof createBody.static;

  export const blockDateBody = t.Object({
    date: t.String({ pattern: dateOnlyPattern }),
  });
  export type blockDateBody = typeof blockDateBody.static;

  export const blockDateQuery = t.Object({
    date: t.String({ pattern: dateOnlyPattern }),
  });
  export type blockDateQuery = typeof blockDateQuery.static;

  // ─── Responses ───────────────────────────────────────────────────────────────

  export const timeSlotResponse = t.Object({
    id: t.String(),
    dayOfWeek: t.Number(),
    time: t.String(),
    active: t.Boolean(),
    blockedDatesCount: t.Number(),
    createdAt: t.String(),
    updatedAt: t.String(),
  });
  export type timeSlotResponse = typeof timeSlotResponse.static;

  export const listResponse = t.Array(timeSlotResponse);
  export type listResponse = typeof listResponse.static;

  // Slot disponível para uma data específica
  export const availableSlotResponse = t.Object({
    id: t.String(),
    time: t.String(),
    available: t.Boolean(),
    unavailableReason: t.Optional(
      t.Union([
        t.Literal("BOOKED"),
        t.Literal("INACTIVE"),
        t.Literal("BLOCKED_DATE"),
      ]),
    ),
  });
  export type availableSlotResponse = typeof availableSlotResponse.static;

  export const availableSlotsResponse = t.Array(availableSlotResponse);
  export type availableSlotsResponse = typeof availableSlotsResponse.static;

  export const blockedDatesResponse = t.Array(
    t.String({ pattern: dateOnlyPattern }),
  );
  export type blockedDatesResponse = typeof blockedDatesResponse.static;

  export const blockDateResponse = t.Object({ success: t.Boolean() });
  export type blockDateResponse = typeof blockDateResponse.static;

  export const deleteResponse = t.Object({ success: t.Boolean() });
  export type deleteResponse = typeof deleteResponse.static;

  // ─── Errors ──────────────────────────────────────────────────────────────────

  export const errorNotFound = t.Literal(Errors.TIME_SLOT.NOT_FOUND.message);
  export type errorNotFound = typeof errorNotFound.static;

  export const errorAlreadyExists = t.Literal(
    Errors.TIME_SLOT.ALREADY_EXISTS.message,
  );
  export type errorAlreadyExists = typeof errorAlreadyExists.static;

  export const errorInUse = t.Literal(Errors.TIME_SLOT.IN_USE.message);
  export type errorInUse = typeof errorInUse.static;

  export const errorBlockAlreadyExists = t.Literal(
    Errors.TIME_SLOT.BLOCK_ALREADY_EXISTS.message,
  );
  export type errorBlockAlreadyExists = typeof errorBlockAlreadyExists.static;

  export const errorBlockDateMismatch = t.Literal(
    Errors.TIME_SLOT.BLOCK_DATE_MISMATCH.message,
  );
  export type errorBlockDateMismatch = typeof errorBlockDateMismatch.static;

  export const errorBlockHasAppointment = t.Literal(
    Errors.TIME_SLOT.BLOCK_HAS_APPOINTMENT.message,
  );
  export type errorBlockHasAppointment = typeof errorBlockHasAppointment.static;

  export const errorBlockNotFound = t.Literal(
    Errors.TIME_SLOT.BLOCK_NOT_FOUND.message,
  );
  export type errorBlockNotFound = typeof errorBlockNotFound.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

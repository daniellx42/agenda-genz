import { Elysia, t } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { TimeSlotModel } from "./time-slot.model";
import { TimeSlotService } from "./time-slot.service";

export const timeSlotController = new Elysia({ prefix: "/time-slots" })
  .use(authMiddleware)

  .get(
    "/",
    async ({ userId, query }) => {
      const dayOfWeek =
        query.dayOfWeek !== undefined ? parseInt(query.dayOfWeek, 10) : undefined;
      return TimeSlotService.list(userId, dayOfWeek);
    },
    {
      planGuard: true,
      query: TimeSlotModel.listQuery,
      response: {
        200: TimeSlotModel.listResponse,
        401: TimeSlotModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/available",
    async ({ userId, query }) =>
      TimeSlotService.getAvailableForDate(userId, query.date),
    {
      planGuard: true,
      query: TimeSlotModel.availableQuery,
      response: {
        200: TimeSlotModel.availableSlotsResponse,
        401: TimeSlotModel.errorUnauthorized,
      },
    },
  )

  .post(
    "/",
    async ({ userId, body }) => TimeSlotService.create(userId, body),
    {
      planGuard: true,
      body: TimeSlotModel.createBody,
      response: {
        200: TimeSlotModel.timeSlotResponse,
        401: TimeSlotModel.errorUnauthorized,
        409: TimeSlotModel.errorAlreadyExists,
      },
    },
  )

  .patch(
    "/:id/deactivate",
    async ({ userId, params }) => TimeSlotService.deactivate(params.id, userId),
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      response: {
        200: TimeSlotModel.timeSlotResponse,
        401: TimeSlotModel.errorUnauthorized,
        404: TimeSlotModel.errorNotFound,
      },
    },
  )

  .patch(
    "/:id/activate",
    async ({ userId, params }) => TimeSlotService.activate(params.id, userId),
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      response: {
        200: TimeSlotModel.timeSlotResponse,
        401: TimeSlotModel.errorUnauthorized,
        404: TimeSlotModel.errorNotFound,
      },
    },
  )

  .get(
    "/:id/blocks",
    async ({ userId, params, query }) =>
      TimeSlotService.listBlockedDates(params.id, userId, query),
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      query: TimeSlotModel.blockedDatesQuery,
      response: {
        200: TimeSlotModel.blockedDatesResponse,
        401: TimeSlotModel.errorUnauthorized,
        404: TimeSlotModel.errorNotFound,
      },
    },
  )

  .post(
    "/:id/blocks",
    async ({ userId, params, body }) => {
      await TimeSlotService.blockDate(params.id, userId, body);
      return { success: true } satisfies TimeSlotModel.blockDateResponse;
    },
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      body: TimeSlotModel.blockDateBody,
      response: {
        200: TimeSlotModel.blockDateResponse,
        400: TimeSlotModel.errorBlockDateMismatch,
        401: TimeSlotModel.errorUnauthorized,
        404: TimeSlotModel.errorNotFound,
        409: t.Union([
          TimeSlotModel.errorBlockAlreadyExists,
          TimeSlotModel.errorBlockHasAppointment,
        ]),
      },
    },
  )

  .delete(
    "/:id/blocks",
    async ({ userId, params, query }) => {
      await TimeSlotService.unblockDate(params.id, userId, query);
      return { success: true } satisfies TimeSlotModel.blockDateResponse;
    },
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      query: TimeSlotModel.blockDateQuery,
      response: {
        200: TimeSlotModel.blockDateResponse,
        400: TimeSlotModel.errorBlockDateMismatch,
        401: TimeSlotModel.errorUnauthorized,
        404: t.Union([
          TimeSlotModel.errorNotFound,
          TimeSlotModel.errorBlockNotFound,
        ]),
      },
    },
  )

  .delete(
    "/:id",
    async ({ userId, params }) => {
      await TimeSlotService.delete(params.id, userId);
      return { success: true } satisfies TimeSlotModel.deleteResponse;
    },
    {
      planGuard: true,
      params: TimeSlotModel.idParams,
      response: {
        200: TimeSlotModel.deleteResponse,
        401: TimeSlotModel.errorUnauthorized,
        404: TimeSlotModel.errorNotFound,
        409: TimeSlotModel.errorInUse,
      },
    },
  );

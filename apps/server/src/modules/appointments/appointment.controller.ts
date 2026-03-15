import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { AppointmentModel } from "./appointment.model";
import { AppointmentService } from "./appointment.service";

export const appointmentController = new Elysia({ prefix: "/appointments" })
  .use(authMiddleware)

  .get(
    "/",
    async ({ userId, query }) =>
      AppointmentService.listByDate(userId, query.date),
    {
      planGuard: true,
      query: AppointmentModel.byDateQuery,
      response: {
        200: AppointmentModel.listResponse,
        401: AppointmentModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/calendar",
    async ({ userId, query }) => {
      const year = parseInt(query.year, 10);
      const month = parseInt(query.month, 10);
      return AppointmentService.getCalendarDots(userId, year, month);
    },
    {
      planGuard: true,
      query: AppointmentModel.calendarQuery,
      response: {
        200: AppointmentModel.calendarResponse,
        401: AppointmentModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/available-slots",
    async ({ userId, query }) =>
      AppointmentService.getAvailableSlotsByDateRange(
        userId,
        query.from,
        query.to,
      ),
    {
      planGuard: true,
      query: AppointmentModel.shareSlotsQuery,
      response: {
        200: AppointmentModel.shareSlotsResponse,
        401: AppointmentModel.errorUnauthorized,
        400: AppointmentModel.errorShareRangeTooLarge,
      },
    },
  )

  .get(
    "/client/:clientId",
    async ({ userId, params, query }) => {
      const page = Math.max(1, parseInt(query.page ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));

      return AppointmentService.listByClient(userId, params.clientId, page, limit);
    },
    {
      planGuard: true,
      params: AppointmentModel.clientIdParams,
      query: AppointmentModel.clientHistoryQuery,
      response: {
        200: AppointmentModel.clientHistoryResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorClientNotFound,
      },
    },
  )

  .post(
    "/",
    async ({ userId, body }) => AppointmentService.create(userId, body),
    {
      planGuard: true,
      body: AppointmentModel.createBody,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        409: AppointmentModel.errorSlotUnavailable,
      },
    },
  )

  .get(
    "/:id",
    async ({ userId, params }) =>
      AppointmentService.getById(params.id, userId),
    {
      planGuard: true,
      params: AppointmentModel.idParams,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  )

  .patch(
    "/:id/status",
    async ({ userId, params, body }) =>
      AppointmentService.updateStatus(params.id, userId, body),
    {
      planGuard: true,
      params: AppointmentModel.idParams,
      body: AppointmentModel.updateStatusBody,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  )

  .delete(
    "/:id/images/:slot",
    async ({ userId, params }) =>
      AppointmentService.deleteImage(params.id, userId, params.slot),
    {
      planGuard: true,
      params: AppointmentModel.imageSlotParams,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  )

  .patch(
    "/:id/payment",
    async ({ userId, params, body }) =>
      AppointmentService.updatePayment(params.id, userId, body),
    {
      planGuard: true,
      params: AppointmentModel.idParams,
      body: AppointmentModel.updatePaymentBody,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  )

  .patch(
    "/:id/images",
    async ({ userId, params, body }) =>
      AppointmentService.updateImages(params.id, userId, body),
    {
      planGuard: true,
      params: AppointmentModel.idParams,
      body: AppointmentModel.updateImagesBody,
      response: {
        200: AppointmentModel.appointmentResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  )

  .delete(
    "/:id",
    async ({ userId, params }) => {
      await AppointmentService.deleteById(params.id, userId);
      return { success: true } satisfies AppointmentModel.deleteResponse;
    },
    {
      planGuard: true,
      params: AppointmentModel.idParams,
      response: {
        200: AppointmentModel.deleteResponse,
        401: AppointmentModel.errorUnauthorized,
        404: AppointmentModel.errorNotFound,
      },
    },
  );

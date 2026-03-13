import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { ServiceModel } from "./service.model";
import { ServiceService } from "./service.service";

export const serviceController = new Elysia({ prefix: "/services" })
  .use(authMiddleware)

  .get(
    "/",
    async ({ userId, query }) => {
      const page = Math.max(1, parseInt(query.page ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
      const activeOnly = query.activeOnly === "true";
      return ServiceService.list(userId, page, limit, query.search, activeOnly);
    },
    {
      planGuard: true,
      query: ServiceModel.listQuery,
      response: {
        200: ServiceModel.listResponse,
        401: ServiceModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/export",
    async ({ userId }) => ServiceService.listAll(userId),
    {
      planGuard: true,
      response: {
        200: ServiceModel.exportResponse,
        401: ServiceModel.errorUnauthorized,
      },
    },
  )

  .post(
    "/",
    async ({ userId, body }) => ServiceService.create(userId, body),
    {
      planGuard: true,
      body: ServiceModel.createBody,
      response: {
        200: ServiceModel.serviceResponse,
        401: ServiceModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/:id",
    async ({ userId, params }) => ServiceService.getById(params.id, userId),
    {
      planGuard: true,
      params: ServiceModel.idParams,
      response: {
        200: ServiceModel.serviceResponse,
        401: ServiceModel.errorUnauthorized,
        404: ServiceModel.errorNotFound,
      },
    },
  )

  .put(
    "/:id",
    async ({ userId, params, body }) =>
      ServiceService.update(params.id, userId, body),
    {
      planGuard: true,
      params: ServiceModel.idParams,
      body: ServiceModel.updateBody,
      response: {
        200: ServiceModel.serviceResponse,
        401: ServiceModel.errorUnauthorized,
        404: ServiceModel.errorNotFound,
      },
    },
  )

  .delete(
    "/:id",
    async ({ userId, params }) => {
      await ServiceService.delete(params.id, userId);
      return { success: true } satisfies ServiceModel.deleteResponse;
    },
    {
      planGuard: true,
      params: ServiceModel.idParams,
      response: {
        200: ServiceModel.deleteResponse,
        401: ServiceModel.errorUnauthorized,
        404: ServiceModel.errorNotFound,
        409: ServiceModel.errorInUse,
      },
    },
  );

import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { ClientModel } from "./client.model";
import { ClientService } from "./client.service";

export const clientController = new Elysia({ prefix: "/clients" })
  .use(authMiddleware)

  .get(
    "/",
    async ({ userId, query }) => {
      const page = Math.max(1, parseInt(query.page ?? "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
      return ClientService.list(userId, page, limit, query.search);
    },
    {
      planGuard: true,
      query: ClientModel.listQuery,
      response: {
        200: ClientModel.listResponse,
        401: ClientModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/search",
    async ({ userId, query }) => ClientService.search(userId, query.q),
    {
      planGuard: true,
      query: ClientModel.searchQuery,
      response: {
        200: ClientModel.searchResponse,
        401: ClientModel.errorUnauthorized,
      },
    },
  )

  .post(
    "/",
    async ({ userId, body }) => ClientService.create(userId, body),
    {
      planGuard: true,
      body: ClientModel.createBody,
      response: {
        200: ClientModel.clientResponse,
        400: ClientModel.errorInvalidBirthDate,
        401: ClientModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/:id",
    async ({ userId, params }) => ClientService.getById(params.id, userId),
    {
      planGuard: true,
      params: ClientModel.idParams,
      response: {
        200: ClientModel.clientResponse,
        400: ClientModel.errorInvalidBirthDate,
        401: ClientModel.errorUnauthorized,
        404: ClientModel.errorNotFound,
      },
    },
  )

  .put(
    "/:id",
    async ({ userId, params, body }) =>
      ClientService.update(params.id, userId, body),
    {
      planGuard: true,
      params: ClientModel.idParams,
      body: ClientModel.updateBody,
      response: {
        200: ClientModel.clientResponse,
        401: ClientModel.errorUnauthorized,
        404: ClientModel.errorNotFound,
      },
    },
  )

  .delete(
    "/:id/profile-image",
    async ({ userId, params }) =>
      ClientService.deleteProfileImage(params.id, userId),
    {
      planGuard: true,
      params: ClientModel.idParams,
      response: {
        200: ClientModel.clientResponse,
        401: ClientModel.errorUnauthorized,
        404: ClientModel.errorNotFound,
      },
    },
  )

  .delete(
    "/:id",
    async ({ userId, params }) => {
      await ClientService.delete(params.id, userId);
      return { success: true } satisfies ClientModel.deleteResponse;
    },
    {
      planGuard: true,
      params: ClientModel.idParams,
      response: {
        200: ClientModel.deleteResponse,
        401: ClientModel.errorUnauthorized,
        404: ClientModel.errorNotFound,
      },
    },
  );

import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace ServiceModel {
  const nonBlankPattern = "^(?=.*\\S).+$";

  // ─── Query Params ────────────────────────────────────────────────────────────

  export const listQuery = t.Object({
    page: t.Optional(t.String({ default: "1" })),
    limit: t.Optional(t.String({ default: "20" })),
    search: t.Optional(t.String()),
    activeOnly: t.Optional(t.String()),
  });
  export type listQuery = typeof listQuery.static;

  // ─── Params ──────────────────────────────────────────────────────────────────

  export const idParams = t.Object({
    id: t.String(),
  });
  export type idParams = typeof idParams.static;

  // ─── Body ────────────────────────────────────────────────────────────────────

  export const createBody = t.Object({
    name: t.String({ minLength: 2, maxLength: 120, pattern: nonBlankPattern }),
    description: t.Optional(t.String({ maxLength: 500 })),
    price: t.Integer({ minimum: 1 }), // centavos
    depositPercentage: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
    color: t.Optional(t.String()),
    emoji: t.Optional(t.String({ maxLength: 8 })),
  });
  export type createBody = typeof createBody.static;

  export const updateBody = t.Object({
    name: t.Optional(t.String({ minLength: 2, maxLength: 120, pattern: nonBlankPattern })),
    description: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
    price: t.Optional(t.Integer({ minimum: 1 })),
    depositPercentage: t.Optional(t.Union([t.Integer({ minimum: 1, maximum: 100 }), t.Null()])),
    color: t.Optional(t.Union([t.String(), t.Null()])),
    emoji: t.Optional(t.Union([t.String({ maxLength: 8 }), t.Null()])),
    active: t.Optional(t.Boolean()),
  });
  export type updateBody = typeof updateBody.static;

  // ─── Responses ───────────────────────────────────────────────────────────────

  export const serviceResponse = t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Union([t.String(), t.Null()]),
    price: t.Number(),
    depositPercentage: t.Union([t.Number(), t.Null()]),
    color: t.Union([t.String(), t.Null()]),
    emoji: t.Union([t.String(), t.Null()]),
    active: t.Boolean(),
    createdAt: t.String(),
    updatedAt: t.String(),
  });
  export type serviceResponse = typeof serviceResponse.static;

  export const listResponse = t.Object({
    data: t.Array(serviceResponse),
    pagination: t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
      totalPages: t.Number(),
    }),
  });
  export type listResponse = typeof listResponse.static;

  export const exportResponse = t.Array(serviceResponse);
  export type exportResponse = typeof exportResponse.static;

  export const deleteResponse = t.Object({ success: t.Boolean() });
  export type deleteResponse = typeof deleteResponse.static;

  // ─── Errors ──────────────────────────────────────────────────────────────────

  export const errorNotFound = t.Literal(Errors.SERVICE.NOT_FOUND.message);
  export type errorNotFound = typeof errorNotFound.static;

  export const errorInUse = t.Literal(Errors.SERVICE.IN_USE.message);
  export type errorInUse = typeof errorInUse.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

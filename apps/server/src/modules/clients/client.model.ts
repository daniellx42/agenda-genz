import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace ClientModel {
  const nonBlankPattern = "^(?=.*\\S).+$";
  const phonePattern = "^\\d{10,11}$";
  const cpfPattern = "^\\d{11}$";
  const instagramPattern = "^@?[A-Za-z0-9._]{1,30}$";
  const dateOnlyPattern = "^\\d{4}-\\d{2}-\\d{2}$";
  const genderSchema = t.Union([
    t.Literal("FEMALE"),
    t.Literal("MALE"),
    t.Literal("OTHER"),
  ]);

  // ─── Query Params ────────────────────────────────────────────────────────────

  export const searchQuery = t.Object({
    q: t.Optional(t.String()),
  });
  export type searchQuery = typeof searchQuery.static;

  export const listQuery = t.Object({
    page: t.Optional(t.String({ default: "1" })),
    limit: t.Optional(t.String({ default: "20" })),
    search: t.Optional(t.String()),
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
    phone: t.String({ pattern: phonePattern }),
    email: t.Optional(t.String({ format: "email", maxLength: 120 })),
    instagram: t.Optional(t.String({ pattern: instagramPattern })),
    cpf: t.Optional(t.String({ pattern: cpfPattern })),
    address: t.Optional(t.String({ maxLength: 240 })),
    birthDate: t.Optional(t.String({ pattern: dateOnlyPattern })),
    gender: t.Optional(genderSchema),
    notes: t.Optional(t.String({ maxLength: 500 })),
    profileImageKey: t.Optional(t.String()),
  });
  export type createBody = typeof createBody.static;

  export const updateBody = t.Object({
    name: t.Optional(t.String({ minLength: 2, maxLength: 120, pattern: nonBlankPattern })),
    phone: t.Optional(t.String({ pattern: phonePattern })),
    email: t.Optional(t.Union([t.String({ format: "email", maxLength: 120 }), t.Null()])),
    instagram: t.Optional(t.Union([t.String({ pattern: instagramPattern }), t.Null()])),
    cpf: t.Optional(t.Union([t.String({ pattern: cpfPattern }), t.Null()])),
    address: t.Optional(t.Union([t.String({ maxLength: 240 }), t.Null()])),
    birthDate: t.Optional(t.Union([t.String({ pattern: dateOnlyPattern }), t.Null()])),
    gender: t.Optional(t.Union([genderSchema, t.Null()])),
    notes: t.Optional(t.Union([t.String({ maxLength: 500 }), t.Null()])),
    profileImageKey: t.Optional(t.Union([t.String(), t.Null()])),
  });
  export type updateBody = typeof updateBody.static;

  // ─── Responses ───────────────────────────────────────────────────────────────

  export const clientResponse = t.Object({
    id: t.String(),
    name: t.String(),
    phone: t.String(),
    email: t.Union([t.String(), t.Null()]),
    instagram: t.Union([t.String(), t.Null()]),
    cpf: t.Union([t.String(), t.Null()]),
    address: t.Union([t.String(), t.Null()]),
    birthDate: t.Union([t.String(), t.Null()]),
    gender: t.Union([genderSchema, t.Null()]),
    notes: t.Union([t.String(), t.Null()]),
    profileImageKey: t.Union([t.String(), t.Null()]),
    lastCompletedAppointmentDate: t.Union([t.String(), t.Null()]),
    createdAt: t.String(),
    updatedAt: t.String(),
  });
  export type clientResponse = typeof clientResponse.static;

  export const searchResponse = t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      phone: t.String(),
      email: t.Union([t.String(), t.Null()]),
      instagram: t.Union([t.String(), t.Null()]),
      profileImageKey: t.Union([t.String(), t.Null()]),
    }),
  );
  export type searchResponse = typeof searchResponse.static;

  export const listResponse = t.Object({
    data: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(),
        phone: t.String(),
        email: t.Union([t.String(), t.Null()]),
        instagram: t.Union([t.String(), t.Null()]),
        notes: t.Union([t.String(), t.Null()]),
        birthDate: t.Union([t.String(), t.Null()]),
        profileImageKey: t.Union([t.String(), t.Null()]),
        lastCompletedAppointmentDate: t.Union([t.String(), t.Null()]),
      }),
    ),
    pagination: t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
      totalPages: t.Number(),
    }),
  });
  export type listResponse = typeof listResponse.static;

  export const deleteResponse = t.Object({
    success: t.Boolean(),
  });
  export type deleteResponse = typeof deleteResponse.static;

  // ─── Errors ──────────────────────────────────────────────────────────────────

  export const errorNotFound = t.Literal(Errors.CLIENT.NOT_FOUND.message);
  export type errorNotFound = typeof errorNotFound.static;

  export const errorProfileImageNotFound = t.Literal(
    Errors.CLIENT.PROFILE_IMAGE_NOT_FOUND.message,
  );
  export type errorProfileImageNotFound = typeof errorProfileImageNotFound.static;

  export const errorInvalidBirthDate = t.Literal(
    Errors.CLIENT.INVALID_BIRTH_DATE.message,
  );
  export type errorInvalidBirthDate = typeof errorInvalidBirthDate.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

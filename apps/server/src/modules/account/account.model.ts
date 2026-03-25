import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace AccountModel {
  export const deleteResponse = t.Object({
    success: t.Boolean(),
  });
  export type deleteResponse = typeof deleteResponse.static;

  export const deleteProfileImageObjectQuery = t.Object({
    key: t.String({ minLength: 1 }),
  });
  export type deleteProfileImageObjectQuery =
    typeof deleteProfileImageObjectQuery.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;

  export const errorProfileImageUnauthorizedKey = t.Literal(
    Errors.ACCOUNT.PROFILE_IMAGE_UNAUTHORIZED_KEY.message,
  );
  export type errorProfileImageUnauthorizedKey =
    typeof errorProfileImageUnauthorizedKey.static;
}

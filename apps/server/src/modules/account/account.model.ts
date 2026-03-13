import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

export namespace AccountModel {
  export const deleteResponse = t.Object({
    success: t.Boolean(),
  });
  export type deleteResponse = typeof deleteResponse.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

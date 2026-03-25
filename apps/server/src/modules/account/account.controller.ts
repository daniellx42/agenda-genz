import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { AccountModel } from "./account.model";
import { AccountService } from "./account.service";

export const accountController = new Elysia({ prefix: "/account" })
  .use(authMiddleware)
  .delete(
    "/profile-image-object",
    async ({ userId, query }) => {
      await AccountService.deleteProfileImageObject(userId, query.key);

      return { success: true } satisfies AccountModel.deleteResponse;
    },
    {
      auth: true,
      query: AccountModel.deleteProfileImageObjectQuery,
      response: {
        200: AccountModel.deleteResponse,
        401: AccountModel.errorUnauthorized,
        403: AccountModel.errorProfileImageUnauthorizedKey,
      },
    },
  )
  .delete(
    "/",
    async ({ userId }) => {
      await AccountService.delete(userId);

      return { success: true } satisfies AccountModel.deleteResponse;
    },
    {
      auth: true,
      response: {
        200: AccountModel.deleteResponse,
        401: AccountModel.errorUnauthorized,
      },
    },
  );

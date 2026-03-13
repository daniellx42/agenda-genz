import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { AccountModel } from "./account.model";
import { AccountService } from "./account.service";

export const accountController = new Elysia({ prefix: "/account" })
  .use(authMiddleware)
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

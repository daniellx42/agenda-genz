import { Elysia } from "elysia";
import { authMiddleware } from "../../shared/middleware/auth";
import { UploadModel } from "./upload.model";
import { UploadService } from "./upload.service";

export const uploadController = new Elysia({ prefix: "/uploads" })
  .use(authMiddleware)

  .post(
    "/presigned-put",
    async ({ userId, body }) => UploadService.generatePutUrl(userId, body),
    {
      planGuard: true,
      body: UploadModel.presignedPutBody,
      response: {
        200: UploadModel.presignedPutResponse,
        400: UploadModel.errorInvalidType,
        401: UploadModel.errorUnauthorized,
      },
    },
  )

  .get(
    "/presigned-get",
    async ({ userId, query }) => UploadService.generateGetUrl(userId, query.key),
    {
      planGuard: true,
      query: UploadModel.presignedGetQuery,
      response: {
        200: UploadModel.presignedGetResponse,
        401: UploadModel.errorUnauthorized,
        403: UploadModel.errorUnauthorizedKey,
      },
    },
  );

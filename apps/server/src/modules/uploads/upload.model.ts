import { t } from "elysia";
import { Errors } from "../../shared/constants/errors";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export function isAllowedImageType(contentType: string): contentType is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export namespace UploadModel {
  // ─── Body ────────────────────────────────────────────────────────────────────

  export const presignedPutBody = t.Object({
    folder: t.Union([t.Literal("services"), t.Literal("profile")]),
    filename: t.String({ minLength: 1, maxLength: 255 }),
    contentType: t.String({ minLength: 1 }),
  });
  export type presignedPutBody = typeof presignedPutBody.static;

  // ─── Query ───────────────────────────────────────────────────────────────────

  export const presignedGetQuery = t.Object({
    key: t.String({ minLength: 1 }),
  });
  export type presignedGetQuery = typeof presignedGetQuery.static;

  // ─── Responses ───────────────────────────────────────────────────────────────

  export const presignedPutResponse = t.Object({
    uploadUrl: t.String(),
    key: t.String(),
  });
  export type presignedPutResponse = typeof presignedPutResponse.static;

  export const presignedGetResponse = t.Object({
    url: t.String(),
  });
  export type presignedGetResponse = typeof presignedGetResponse.static;

  // ─── Errors ──────────────────────────────────────────────────────────────────

  export const errorInvalidType = t.Literal(Errors.UPLOAD.INVALID_TYPE.message);
  export type errorInvalidType = typeof errorInvalidType.static;

  export const errorUnauthorizedKey = t.Literal(Errors.UPLOAD.UNAUTHORIZED_KEY.message);
  export type errorUnauthorizedKey = typeof errorUnauthorizedKey.static;

  export const errorUnauthorized = t.Literal(Errors.AUTH.UNAUTHORIZED.message);
  export type errorUnauthorized = typeof errorUnauthorized.static;
}

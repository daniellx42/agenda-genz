import { env } from "@agenda-genz/env/server";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { cloudflareR2 } from "../../shared/lib/cloudeflare";
import type { UploadModel } from "./upload.model";
import { isAllowedImageType } from "./upload.model";

const PUT_EXPIRES_IN = 300;    // 5 minutes
const GET_EXPIRES_IN = 86400;  // 24 hours

function getAuthorizedPrefixes(userId: string): string[] {
  return [
    `services/${userId}/`,
    `profile/${userId}/`,
  ];
}

// Sanitize filename to avoid path traversal and weird chars
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

function buildKey(folder: string, userId: string, filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const randomId = crypto.randomUUID();
  return `${folder}/${userId}/${randomId}-${sanitized}`;
}

export abstract class UploadService {
  private static async listKeysByPrefix(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await cloudflareR2.send(
        new ListObjectsV2Command({
          Bucket: env.CLOUDFLARE_BUCKET,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      keys.push(
        ...(response.Contents ?? [])
          .map((item) => item.Key)
          .filter((key): key is string => Boolean(key)),
      );

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return keys;
  }

  private static async deleteKeys(keys: string[]): Promise<void> {
    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);

      if (batch.length === 0) continue;

      await cloudflareR2.send(
        new DeleteObjectsCommand({
          Bucket: env.CLOUDFLARE_BUCKET,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );
    }
  }

  static async generatePutUrl(
    userId: string,
    data: UploadModel.presignedPutBody,
  ): Promise<UploadModel.presignedPutResponse> {
    if (!isAllowedImageType(data.contentType)) {
      throw status(
        Errors.UPLOAD.INVALID_TYPE.httpStatus,
        Errors.UPLOAD.INVALID_TYPE.message satisfies UploadModel.errorInvalidType,
      );
    }

    const key = buildKey(data.folder, userId, data.filename);

    const command = new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
      ContentType: data.contentType,
    });

    const uploadUrl = await getSignedUrl(cloudflareR2, command, {
      expiresIn: PUT_EXPIRES_IN,
    });

    return { uploadUrl, key };
  }

  static async generateGetUrl(
    userId: string,
    key: string,
  ): Promise<UploadModel.presignedGetResponse> {
    // Validate that the key belongs to this user
    // Keys follow pattern: {folder}/{userId}/{randomId}-{filename}
    const authorizedPrefixes = getAuthorizedPrefixes(userId);

    if (!authorizedPrefixes.some((prefix) => key.startsWith(prefix))) {
      throw status(
        Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
        Errors.UPLOAD.UNAUTHORIZED_KEY.message satisfies UploadModel.errorUnauthorizedKey,
      );
    }

    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(cloudflareR2, command, {
      expiresIn: GET_EXPIRES_IN,
    });

    return { url };
  }

  static async deleteObject(userId: string, key: string): Promise<void> {
    const authorizedPrefixes = getAuthorizedPrefixes(userId);

    if (!authorizedPrefixes.some((prefix) => key.startsWith(prefix))) {
      throw status(
        Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
        Errors.UPLOAD.UNAUTHORIZED_KEY.message satisfies UploadModel.errorUnauthorizedKey,
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: key,
    });

    await cloudflareR2.send(command);
  }

  static async deleteAllUserObjects(userId: string): Promise<void> {
    const keys = (
      await Promise.all(
        getAuthorizedPrefixes(userId).map((prefix) =>
          this.listKeysByPrefix(prefix),
        ),
      )
    ).flat();

    if (keys.length === 0) return;

    await this.deleteKeys(keys);
  }
}

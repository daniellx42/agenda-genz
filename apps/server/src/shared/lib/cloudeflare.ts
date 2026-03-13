import { env } from '@agenda-genz/env/server'
import { S3Client } from '@aws-sdk/client-s3'

export const cloudflareR2 = new S3Client({
    region: 'auto',
    endpoint: env.CLOUDFLARE_ENDPOINT,
    // R2 is S3-compatible, but checksum auto-calculation is only needed when
    // the service explicitly requires it. Keeping this lean avoids extra
    // signing parameters on presigned URLs and request headers on object ops.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
        accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
})

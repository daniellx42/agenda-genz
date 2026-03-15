import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "",
  client: {},
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    CLOUDFLARE_ENDPOINT: z.url(),
    CLOUDFLARE_ACCESS_KEY_ID: z.string().min(1),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string().min(1),
    CLOUDFLARE_BUCKET: z.string().min(1),
    MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1),
    MERCADO_PAGO_PUBLIC_KEY: z.string().min(1),
    MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(1),
    SERVER_URL: z.url(),
    FRONTEND_URL: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

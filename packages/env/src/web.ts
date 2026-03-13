import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_FRONTEND_URL: z.url(),

    NEXT_PUBLIC_APP_STORE_URL: z.url(),
    NEXT_PUBLIC_PLAY_STORE_URL: z.url(),

    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string(),
  },
  server: {
    DATABASE_URL_UTM: z.string(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,

    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,

    NEXT_PUBLIC_APP_STORE_URL: process.env.NEXT_PUBLIC_APP_STORE_URL,
    NEXT_PUBLIC_PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL,

    DATABASE_URL_UTM: process.env.DATABASE_URL_UTM,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
});

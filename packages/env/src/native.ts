import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_FRONTEND_URL: z.url(),

    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().min(1),
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.string(),
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: z.string(),
  },
  // Expo only inlines EXPO_PUBLIC_* when they are accessed statically.
  runtimeEnvStrict: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_FRONTEND_URL: process.env.EXPO_PUBLIC_FRONTEND_URL,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
  },
  emptyStringAsUndefined: true,
  skipValidation: !process.env.EAS_BUILD,
});

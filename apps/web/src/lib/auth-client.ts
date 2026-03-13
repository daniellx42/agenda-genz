import { env } from "@agenda-genz/env/web";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_FRONTEND_URL,
  basePath: "/api/auth",
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        trialStartedAt: { type: "date" },
        planExpiresAt: { type: "date" },
      },
    }),
  ],
});

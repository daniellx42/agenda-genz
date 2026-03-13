import type { App } from "@agenda-genz/api-types";
import { env } from "@agenda-genz/env/native";
import { treaty } from "@elysiajs/eden";
import { authClient } from "./auth-client";

export const api = treaty<App>(env.EXPO_PUBLIC_SERVER_URL, {
  onRequest: (_path, options) => {
    const cookie = authClient.getCookie();
    if (cookie) {
      options.headers = {
        ...(options.headers as Record<string, string>),
        Cookie: cookie,
      };
    }
    return options;
  },
});

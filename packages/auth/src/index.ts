import prisma from "@agenda-genz/db";
import { env } from "@agenda-genz/env/server";
import { expo } from "@better-auth/expo";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";

const authOrigin = new URL(env.BETTER_AUTH_URL).origin;
const serverOrigin = new URL(env.SERVER_URL).origin;
const frontendOrigin = new URL(env.FRONTEND_URL).origin;

const publicAuthHosts = Array.from(
  new Set([env.BETTER_AUTH_URL, env.SERVER_URL, env.FRONTEND_URL].map((value) => new URL(value).host)),
);

const authOptions = {
  baseURL: {
    allowedHosts: [...publicAuthHosts],
    fallback: authOrigin,
    protocol: "https",
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [
    authOrigin,
    serverOrigin,
    frontendOrigin,
    "https://appleid.apple.com",
    "app://",
    "exp+agenda-genz://",
    ...(env.NODE_ENV === "development"
      ? ["exp://*.*.*.*:*/**"]
      : []),
  ],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account",
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: env.NODE_ENV === "development" ? "lax" : "none",
      secure: env.NODE_ENV !== "development",
      httpOnly: true,
    },
  },
  plugins: [expo()],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
      },
      trialStartedAt: {
        type: "date",
        required: false,
        input: false,
      },
      planExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const now = new Date();
          const planExpiresAt = new Date(now);
          planExpiresAt.setDate(planExpiresAt.getDate() + 90);

          return {
            data: {
              ...user,
              role: "USER",
              trialStartedAt: now,
              planExpiresAt,
            },
          };
        },
      },
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...authOptions,
  plugins: [
    ...(authOptions.plugins ?? []),
    customSession(
      async ({ user, session }) => {
        const persistedUser = await prisma.user.findUnique({
          where: {
            id: session.userId,
          },
          select: {
            role: true,
            trialStartedAt: true,
            planExpiresAt: true,
          },
        });

        return {
          user: {
            ...user,
            role: persistedUser?.role ?? "USER",
            trialStartedAt: persistedUser?.trialStartedAt ?? null,
            planExpiresAt: persistedUser?.planExpiresAt ?? null,
          },
          session,
        };
      },
      authOptions,
    ),
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/utm-client/client";
import { env } from "@agenda-genz/env/web";

declare global {
  var utmPrisma: PrismaClient | undefined;
}

function getConnectionString() {
  const connectionString = env.DATABASE_URL_UTM;

  if (!connectionString) {
    throw new Error("DATABASE_URL_UTM is not configured in apps/web/.env");
  }

  return connectionString;
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getConnectionString(),
    }),
  });
}

export const utmPrisma = globalThis.utmPrisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.utmPrisma = utmPrisma;
}

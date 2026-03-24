import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const localEnvPath = fileURLToPath(
  new URL("../../apps/server/.env", import.meta.url),
);

// Preenche a partir do .env local sem sobrescrever envs já injetadas pelo ambiente.
dotenv.config({ path: localEnvPath, override: false });

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});

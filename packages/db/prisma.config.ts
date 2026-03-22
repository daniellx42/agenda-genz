import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const localEnvPath = fileURLToPath(
  new URL("../../apps/server/.env", import.meta.url),
);

// Preenche a partir do .env local sem sobrescrever envs já injetadas pelo ambiente.
dotenv.config({ path: localEnvPath, override: false });

console.log({
  log: "Prisma config",
  cwd: process.cwd(),
  localEnvPath,
  envFileExists: fs.existsSync(localEnvPath),
  hasDbUrlBeforeDotenv: Boolean(process.env.DATABASE_URL),
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});

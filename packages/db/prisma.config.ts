import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const localEnvPath = path.resolve(process.cwd(), "../../apps/server/.env");

if (!process.env.DATABASE_URL && existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

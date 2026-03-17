import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const envPath = path.resolve(process.cwd(), "apps/server/.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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
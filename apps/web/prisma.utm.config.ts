import dotenv from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: ".env",
});

export default defineConfig({
  schema: path.join("prisma", "utm"),
  migrations: {
    path: path.join("prisma", "utm", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL_UTM"),
  },
});

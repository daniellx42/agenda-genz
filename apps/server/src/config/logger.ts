import { logger } from "@bogeychan/elysia-logger";
import { Elysia } from "elysia";

const isProduction = process.env.NODE_ENV === "production";
const isCompiledBinary = !process.execPath.includes("bun");

const usePrettyLogger = !isProduction && !isCompiledBinary;

export const loggerPino = new Elysia().use(
  logger({
    level: isProduction ? "info" : "debug",
    ...(usePrettyLogger
      ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
            messageFormat: "{request.method} {request.url} - {responseTime}ms",
            singleLine: true,
          },
        },
      }
      : {}),
  })
);
import { logger } from "@bogeychan/elysia-logger";
import { Elysia } from "elysia";

export const loggerPino = new Elysia().use(
  logger({
    level: "debug",
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
  })
);

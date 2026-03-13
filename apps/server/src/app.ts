import { auth } from "@agenda-genz/auth";
import { env } from "@agenda-genz/env/server";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { loggerPino } from "./config/logger";
import { accountController } from "./modules/account/account.controller";
import { appointmentController } from "./modules/appointments/appointment.controller";
import { billingController } from "./modules/billing/billing.controller";
import { billingWs } from "./modules/billing/billing.ws";
import { clientController } from "./modules/clients/client.controller";
import { serviceController } from "./modules/services/service.controller";
import { timeSlotController } from "./modules/time-slots/time-slot.controller";
import { uploadController } from "./modules/uploads/upload.controller";

const corsOrigins = [
  env.FRONTEND_URL,
  "app://",
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^exp:\/\/.+$/,
];


export const app = new Elysia()
  .use(
    cors({
      origin: corsOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      credentials: true,
    }),
  )
  .mount(auth.handler)
  .use(loggerPino)
  .use(billingWs)
  .get("/", () => "OK")
  .get("/health", () => "OK")
  .group("/api", (app) =>
    app
      .use(accountController)
      .use(clientController)
      .use(serviceController)
      .use(timeSlotController)
      .use(appointmentController)
      .use(uploadController)
      .use(billingController),
  );

export type App = typeof app;

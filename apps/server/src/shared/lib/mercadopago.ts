import { env } from "@agenda-genz/env/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

const mpClient = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const mpPayment = new Payment(mpClient);

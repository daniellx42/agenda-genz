import { describe, expect, it } from "bun:test";
import { parsePaymentApprovedMessage } from "./billing-ws-message";

describe("parsePaymentApprovedMessage", () => {
  it("lê uma mensagem válida de pagamento aprovado", () => {
    expect(
      parsePaymentApprovedMessage(
        JSON.stringify({
          type: "payment_approved",
          paymentId: "payment-1",
          planExpiresAt: "2026-04-22T12:00:00.000Z",
        }),
      ),
    ).toEqual({
      type: "payment_approved",
      paymentId: "payment-1",
      planExpiresAt: "2026-04-22T12:00:00.000Z",
    });
  });

  it("ignora payload inválido", () => {
    expect(parsePaymentApprovedMessage("{")).toBeNull();
    expect(
      parsePaymentApprovedMessage(
        JSON.stringify({
          type: "payment_approved",
          paymentId: 10,
        }),
      ),
    ).toBeNull();
  });
});

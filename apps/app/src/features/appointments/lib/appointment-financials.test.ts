import { describe, expect, it } from "bun:test";
import {
  getAppointmentDepositAmountCents,
  getAppointmentPaidAmountCents,
  getAppointmentRemainingAmountCents,
} from "./appointment-financials";

describe("appointment-financials", () => {
  it("calcula o sinal e o restante corretamente", () => {
    expect(getAppointmentDepositAmountCents(15000, 30)).toBe(4500);
    expect(getAppointmentRemainingAmountCents(15000, 30)).toBe(10500);
  });

  it("retorna o valor total pago quando o pagamento está quitado", () => {
    expect(getAppointmentPaidAmountCents(15000, 30, "PAID")).toBe(15000);
  });

  it("retorna apenas o sinal quando o pagamento está parcial", () => {
    expect(getAppointmentPaidAmountCents(15000, 30, "DEPOSIT_PAID")).toBe(4500);
  });

  it("considera o valor cheio quando não existe porcentagem de sinal", () => {
    expect(getAppointmentPaidAmountCents(15000, null, "DEPOSIT_PAID")).toBe(15000);
  });

  it("retorna zero quando não houve pagamento", () => {
    expect(getAppointmentPaidAmountCents(15000, 30, "PENDING")).toBe(0);
  });
});

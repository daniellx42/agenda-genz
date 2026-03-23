import { describe, expect, it } from "bun:test";
import { formatAppointmentTimeWithPeriod } from "./appointment-time";

describe("formatAppointmentTimeWithPeriod", () => {
  it("formata horários da manhã", () => {
    expect(formatAppointmentTimeWithPeriod("09:00")).toBe("09:00 da manhã");
  });

  it("formata horários da tarde", () => {
    expect(formatAppointmentTimeWithPeriod("13:00")).toBe("13:00 da tarde");
  });

  it("formata horários da noite", () => {
    expect(formatAppointmentTimeWithPeriod("20:00")).toBe("20:00 da noite");
  });

  it("mantém o horário original quando o formato é inválido", () => {
    expect(formatAppointmentTimeWithPeriod("9h")).toBe("9h");
  });
});

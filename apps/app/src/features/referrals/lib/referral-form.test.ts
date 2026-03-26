import { describe, expect, it } from "bun:test";
import { isValidPixKey, resolvePixKey } from "./referral-form";

describe("referral-form pix key resolution", () => {
  it("normaliza email e infere o tipo EMAIL", () => {
    expect(resolvePixKey(" User@Test.com ")).toEqual({
      value: "user@test.com",
      type: "EMAIL",
    });
  });

  it("normaliza CPF válido e infere o tipo CPF", () => {
    expect(resolvePixKey("529.982.247-25")).toEqual({
      value: "52998224725",
      type: "CPF",
    });
  });

  it("normaliza telefone brasileiro e infere o tipo PHONE", () => {
    expect(resolvePixKey("(11) 99999-8888")).toEqual({
      value: "+5511999998888",
      type: "PHONE",
    });
  });

  it("aceita chave aleatória UUID e infere o tipo RANDOM", () => {
    expect(
      resolvePixKey("550E8400-E29B-41D4-A716-446655440000"),
    ).toEqual({
      value: "550e8400-e29b-41d4-a716-446655440000",
      type: "RANDOM",
    });
  });

  it("rejeita valores numéricos que não correspondem aos tipos aceitos", () => {
    expect(resolvePixKey("12345678000199")).toBeNull();
    expect(isValidPixKey("12345678000199")).toBe(false);
  });
});


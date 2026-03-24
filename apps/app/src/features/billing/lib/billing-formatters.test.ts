import { describe, expect, it } from "bun:test";
import { formatDurationLabel, formatPerMonth } from "./billing-formatters";

describe("billing-formatters", () => {
  it("mostra 12 meses para planos anuais", () => {
    expect(formatDurationLabel(365)).toBe("12 meses");
  });

  it("calcula o valor mensal do anual sem fração quebrada de meses", () => {
    expect(formatPerMonth(120000, 365)).toBe("R$ 100,00/mês");
  });
});

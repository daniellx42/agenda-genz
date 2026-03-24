import { describe, expect, it } from "bun:test";
import {
  calculatePixRemainingSeconds,
  formatPixCountdown,
} from "./use-pix-countdown";

describe("use-pix-countdown helpers", () => {
  it("calcula corretamente o tempo restante", () => {
    expect(
      calculatePixRemainingSeconds(
        "2026-03-23T12:01:05.000Z",
        new Date("2026-03-23T12:00:00.000Z").getTime(),
      ),
    ).toBe(65);
  });

  it("retorna zero quando não existe data de expiração", () => {
    expect(calculatePixRemainingSeconds(null)).toBe(0);
  });

  it("formata o contador no padrão mm:ss e limita negativos", () => {
    expect(formatPixCountdown(65)).toBe("01:05");
    expect(formatPixCountdown(-4)).toBe("00:00");
  });
});

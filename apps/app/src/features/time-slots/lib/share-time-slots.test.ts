import { describe, expect, it } from "bun:test";
import {
  buildShareMarkedDates,
  buildShareTimeSlotsMessage,
  clampShareEndDate,
  getShareTimeSlotsMessage,
} from "./share-time-slots";

describe("clampShareEndDate", () => {
  it("mantém a data final quando o intervalo cabe em 7 dias", () => {
    expect(clampShareEndDate("2026-03-02", "2026-03-08")).toEqual({
      end: "2026-03-08",
      didClamp: false,
    });
  });

  it("corta automaticamente quando o usuário passa de 7 dias", () => {
    expect(clampShareEndDate("2026-03-02", "2026-03-10")).toEqual({
      end: "2026-03-08",
      didClamp: true,
    });
  });
});

describe("buildShareMarkedDates", () => {
  it("marca corretamente um intervalo no calendário", () => {
    const markedDates = buildShareMarkedDates("2026-03-02", "2026-03-04");

    expect(markedDates["2026-03-02"]).toMatchObject({
      startingDay: true,
    });
    expect(markedDates["2026-03-03"]).toMatchObject({
      color: "#f43f5e",
    });
    expect(markedDates["2026-03-04"]).toMatchObject({
      endingDay: true,
    });
  });
});

describe("buildShareTimeSlotsMessage", () => {
  it("monta a mensagem listando apenas horários disponíveis", () => {
    const message = buildShareTimeSlotsMessage([
      {
        dayLabel: "Terça-feira, 03/03",
        slots: [
          { time: "09:00", available: true },
          { time: "12:00", available: false },
        ],
      },
    ]);

    expect(message).toContain("09:00 (Disponível ✅)");
    expect(message).not.toContain("12:00");
  });
});

describe("getShareTimeSlotsMessage", () => {
  it("retorna null quando não existe nenhum horário para compartilhar", () => {
    expect(getShareTimeSlotsMessage([])).toBeNull();
  });

  it("retorna null quando todos os horários do período estão indisponíveis", () => {
    expect(
      getShareTimeSlotsMessage([
        {
          dayLabel: "Terça-feira, 03/03",
          slots: [{ time: "12:00", available: false }],
        },
      ]),
    ).toBeNull();
  });
});

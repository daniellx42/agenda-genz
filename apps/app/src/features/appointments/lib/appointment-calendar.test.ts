import { describe, expect, it } from "bun:test";
import {
  buildMarkedDates,
  getCalendarHeight,
  getCalendarWeekCount,
} from "./appointment-calendar";

describe("buildMarkedDates", () => {
  it("mantém os dias com agendamento marcados e preserva o selecionado", () => {
    const marks = buildMarkedDates(
      [{ date: "2026-03-25" }, { date: "2026-03-27" }],
      "2026-03-25",
    );

    expect(marks["2026-03-25"]).toEqual({
      marked: true,
      dotColor: "white",
      selected: true,
      selectedColor: "#f43f5e",
      textColor: "white",
    });
    expect(marks["2026-03-27"]).toEqual({
      marked: true,
      dotColor: "#f43f5e",
    });
  });

  it("normaliza datas que chegam como objeto Date", () => {
    const marks = buildMarkedDates(
      [{ date: new Date("2026-03-12T12:00:00.000Z") }],
      "2026-03-11",
    );

    expect(marks["2026-03-12"]).toEqual({
      marked: true,
      dotColor: "#f43f5e",
    });
  });

  it("calcula a quantidade de semanas visiveis do mes atual", () => {
    expect(getCalendarWeekCount({ year: 2026, month: 2 })).toBe(4);
    expect(getCalendarWeekCount({ year: 2026, month: 3 })).toBe(5);
    expect(getCalendarWeekCount({ year: 2026, month: 8 })).toBe(6);
  });

  it("ajusta a altura do calendario com base no numero de semanas", () => {
    expect(getCalendarHeight({ year: 2026, month: 2 })).toBe(284);
    expect(getCalendarHeight({ year: 2026, month: 3 })).toBe(338);
    expect(getCalendarHeight({ year: 2026, month: 8 })).toBe(392);
  });
});

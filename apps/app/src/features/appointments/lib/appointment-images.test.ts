import { describe, expect, it } from "bun:test";
import {
  formatAppointmentDate,
  formatAppointmentShortDate,
} from "./appointment-date";

describe("formatAppointmentDate", () => {
  it("retorna fallback quando recebe undefined", () => {
    expect(formatAppointmentDate(undefined)).toBe("Data indisponível");
  });

  it("aceita datas em string simples", () => {
    expect(formatAppointmentDate("2026-03-11")).toContain("2026");
  });

  it("preserva o mesmo dia ao receber string ISO", () => {
    expect(formatAppointmentDate("2026-03-11T00:00:00.000Z")).toBe(
      formatAppointmentDate("2026-03-11"),
    );
  });

  it("aceita objeto Date", () => {
    expect(formatAppointmentDate(new Date("2026-03-11T12:00:00.000Z"))).toContain(
      "2026",
    );
  });

  it("formata datas curtas sem gerar Invalid Date", () => {
    expect(formatAppointmentShortDate("2026-03-11")).not.toBe("Data indisponível");
  });

  it("preserva o mesmo dia curto ao receber string ISO", () => {
    expect(formatAppointmentShortDate("2026-03-11T00:00:00.000Z")).toBe(
      formatAppointmentShortDate("2026-03-11"),
    );
  });
});

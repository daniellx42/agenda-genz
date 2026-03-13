import { describe, expect, it } from "bun:test";
import { buildServicesPdfDocument, sanitizePdfText } from "./service-pdf";

describe("sanitizePdfText", () => {
  it("remove acentos e caracteres fora do ASCII", () => {
    expect(sanitizePdfText("Deposição de unha 💅")).toBe("Deposicao de unha");
  });
});

describe("buildServicesPdfDocument", () => {
  it("inclui a coluna de sinal e o aviso quando necessário", () => {
    const pdf = buildServicesPdfDocument(
      [
        {
          id: "service-1",
          name: "Unhas em Gel",
          description: null,
          price: 15000,
          depositPercentage: 30,
          emoji: "💅",
          color: null,
          active: true,
          createdAt: "2026-03-11T00:00:00.000Z",
          updatedAt: "2026-03-11T00:00:00.000Z",
        },
      ],
      "Ana Beatriz",
    );

    expect(pdf).toContain("Lista de servicos");
    expect(pdf).toContain("Sinal");
    expect(pdf).toContain("R$ 45,00");
    expect(pdf).toContain("garantir o agendamento");
  });

  it("omite a coluna de sinal quando nenhum serviço tem depósito", () => {
    const pdf = buildServicesPdfDocument(
      [
        {
          id: "service-1",
          name: "Escova",
          description: null,
          price: 9000,
          depositPercentage: null,
          emoji: null,
          color: null,
          active: true,
          createdAt: "2026-03-11T00:00:00.000Z",
          updatedAt: "2026-03-11T00:00:00.000Z",
        },
      ],
      "Ana Beatriz",
    );

    expect(pdf).toContain("Preco");
    expect(pdf).not.toContain("garantir o agendamento");
  });
});

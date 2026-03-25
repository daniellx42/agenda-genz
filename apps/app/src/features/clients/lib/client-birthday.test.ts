import { describe, expect, it } from "bun:test";
import {
  formatBirthDate,
  formatBirthDateInput,
  formatBirthDateInputFromValue,
  getClientBirthdayListBadge,
  getClientBirthdayDetails,
  toBirthDateValue,
} from "./client-birthday";

describe("client-birthday", () => {
  it("aplica a máscara DD/MM/AAAA no campo", () => {
    expect(formatBirthDateInput("12041996")).toBe("12/04/1996");
    expect(formatBirthDateInput("1204")).toBe("12/04");
  });

  it("converte o valor digitado para YYYY-MM-DD", () => {
    expect(
      toBirthDateValue("12/04/1996", new Date(2026, 2, 24)),
    ).toBe("1996-04-12");
  });

  it("formata corretamente a data salva para preencher o form e a tela", () => {
    expect(formatBirthDateInputFromValue("1996-04-12")).toBe("12/04/1996");
    expect(formatBirthDateInputFromValue(new Date(1996, 3, 12))).toBe("12/04/1996");
    expect(formatBirthDateInputFromValue(new Date(Date.UTC(1996, 3, 12, 0, 0, 0)))).toBe(
      "12/04/1996",
    );
    expect(formatBirthDate("1996-04-12")).toContain("12");
    expect(formatBirthDate("1996-04-12")).toContain("abril");
    expect(formatBirthDate(new Date(1996, 3, 12))).toContain("abril");
  });

  it("calcula a contagem regressiva até o próximo aniversário", () => {
    const details = getClientBirthdayDetails(
      "1996-04-12",
      new Date(2026, 2, 24),
    );

    expect(details).not.toBeNull();
    expect(details?.daysUntilBirthday).toBe(19);
    expect(details?.turningAge).toBe(30);
    expect(details?.isBirthdayMonth).toBe(false);
    expect(details?.badgeLabel).toBe("Aniversário 2026");
  });

  it("ativa o modo de atenção quando já entrou no mês do aniversário", () => {
    const details = getClientBirthdayDetails(
      "1996-04-12",
      new Date(2026, 3, 3),
    );

    expect(details?.isBirthdayMonth).toBe(true);
    expect(details?.headline).toBe("Faltam 9 dias para o aniversário desta cliente");
  });

  it("trata corretamente datas vindas do banco como Date sem pular para o ano seguinte", () => {
    const details = getClientBirthdayDetails(
      new Date(Date.UTC(1996, 2, 24, 0, 0, 0)),
      new Date(2026, 2, 24, 12, 0, 0),
    );

    expect(details?.daysUntilBirthday).toBe(0);
    expect(details?.headline).toBe("Hoje é o aniversário desta cliente");
    expect(details?.supportingText).toContain("completa 30 anos hoje");
  });

  it("mostra badge de listagem apenas no mês do aniversário enquanto ele ainda não passou", () => {
    expect(
      getClientBirthdayListBadge("1996-04-12", new Date(2026, 2, 24)),
    ).toBeNull();

    expect(
      getClientBirthdayListBadge("1996-04-12", new Date(2026, 3, 3)),
    ).toEqual({
      label: "Faltam 9 dias para o aniversário deste cliente",
      tone: "sky",
    });

    expect(
      getClientBirthdayListBadge("1996-04-12", new Date(2026, 3, 12)),
    ).toEqual({
      label: "Hoje é o aniversário deste cliente",
      tone: "red",
    });

    expect(
      getClientBirthdayListBadge("1996-04-12", new Date(2026, 3, 20)),
    ).toBeNull();
  });
});

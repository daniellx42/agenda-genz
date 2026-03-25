import { describe, expect, it } from "bun:test";
import {
  buildClientBirthdayMessage,
  buildClientFollowUpMessage,
} from "./client-share-messages";

describe("client-share-messages", () => {
  it("monta a mensagem de follow-up com plural corretamente", () => {
    const message = buildClientFollowUpMessage({
      clientName: "Maria Silva",
      daysSinceLastAppointment: 23,
    });

    expect(message).toContain("Olá Maria Silva, tudo bem?");
    expect(message).toContain(
      "Já fazem 23 dias desde o seu último atendimento por aqui.",
    );
    expect(message).toContain("gostaria de marcar um novo atendimento");
  });

  it("usa singular quando passou apenas um dia", () => {
    const message = buildClientFollowUpMessage({
      clientName: "Maria Silva",
      daysSinceLastAppointment: 1,
    });

    expect(message).toContain("Já faz 1 dia desde o seu último atendimento por aqui.");
  });

  it("trata o caso em que o último atendimento foi hoje", () => {
    const message = buildClientFollowUpMessage({
      clientName: "Maria Silva",
      daysSinceLastAppointment: 0,
    });

    expect(message).toContain("Seu último atendimento foi hoje por aqui.");
  });

  it("monta a mensagem de aniversário com incentivo para novo agendamento", () => {
    const message = buildClientBirthdayMessage({
      clientName: "Maria Silva",
      daysUntilBirthday: 12,
      turningAge: 30,
    });

    expect(message).toContain("Faltam 12 dias para o seu aniversário.");
    expect(message).toContain("celebrar seus 30 anos");
    expect(message).toContain("desconto exclusivo");
    expect(message).toContain("garantir seu horário");
  });

  it("troca para uma mensagem de parabéns no dia do aniversário", () => {
    const message = buildClientBirthdayMessage({
      clientName: "Maria Silva",
      daysUntilBirthday: 0,
      turningAge: 30,
    });

    expect(message).toContain("Parabéns pelo seu dia");
    expect(message).toContain("agradecer pela sua confiança");
    expect(message).toContain("cliente fiel e tão especial");
  });
});

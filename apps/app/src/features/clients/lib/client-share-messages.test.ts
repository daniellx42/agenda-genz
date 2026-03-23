import { describe, expect, it } from "bun:test";
import { buildClientFollowUpMessage } from "./client-share-messages";

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
});

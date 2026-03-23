import { describe, expect, it } from "bun:test";
import {
  buildAppointmentConfirmationMessage,
  buildAppointmentReminderMessage,
  getAppointmentCountdownLabel,
  getAppointmentReminderCountdownLabel,
} from "./appointment-share-messages";

describe("appointment-share-messages", () => {
  const baseInput = {
    clientName: "Maria Silva",
    serviceName: "Alongamento em gel",
    date: "2026-03-25",
    time: "10:30",
    serviceStatus: "CONFIRMED" as const,
    paymentStatus: "DEPOSIT_PAID" as const,
    notes: "Chegar com 10 minutos de antecedência.",
  };

  it("monta a mensagem de confirmação com os status do agendamento", () => {
    const message = buildAppointmentConfirmationMessage(baseInput);

    expect(message).toContain("Olá Maria Silva");
    expect(message).toContain("Horário: 10:30 da manhã");
    expect(message).toContain("Status do agendamento: Confirmado");
    expect(message).toContain("Status do pagamento: Sinal pago");
    expect(message).toContain("Observações: Chegar com 10 minutos de antecedência.");
  });

  it("calcula o countdown do lembrete em dias e horas", () => {
    const countdown = getAppointmentCountdownLabel(baseInput, new Date(2026, 2, 23, 8, 0, 0));

    expect(countdown).toBe("2 dias e 2 horas");
  });

  it("calcula o countdown detalhado do lembrete com dias e horas:minutos", () => {
    const countdown = getAppointmentReminderCountdownLabel(
      baseInput,
      new Date(2026, 2, 24, 7, 9, 0),
    );

    expect(countdown).toBe("1 dia, 3:21 horas");
  });

  it("inclui o countdown na mensagem de lembrete", () => {
    const message = buildAppointmentReminderMessage(
      baseInput,
      new Date(2026, 2, 25, 8, 30, 0),
    );

    expect(message).toContain("Olá Maria Silva");
    expect(message).toContain(
      "Seu atendimento está agendado para daqui 2:00 horas, não se esqueça ❤️",
    );
  });

  it("calcula o lembrete corretamente quando a data vem em formato ISO", () => {
    const message = buildAppointmentReminderMessage(
      {
        ...baseInput,
        date: "2026-03-25T00:00:00.000Z",
      },
      new Date(2026, 2, 25, 8, 30, 0),
    );

    expect(message).toContain(
      "Seu atendimento está agendado para daqui 2:00 horas, não se esqueça ❤️",
    );
  });
});

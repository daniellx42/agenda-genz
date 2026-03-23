import { normalizeWhitespace } from "@/lib/formatters";

interface ClientFollowUpMessageInput {
  clientName: string;
  daysSinceLastAppointment: number;
}

function getClientDisplayName(name: string) {
  return normalizeWhitespace(name) || "cliente";
}

function getLastAppointmentSentence(daysSinceLastAppointment: number) {
  if (daysSinceLastAppointment <= 0) {
    return "Seu último atendimento foi hoje por aqui.";
  }

  if (daysSinceLastAppointment === 1) {
    return "Já faz 1 dia desde o seu último atendimento por aqui.";
  }

  return `Já fazem ${daysSinceLastAppointment} dias desde o seu último atendimento por aqui.`;
}

export function buildClientFollowUpMessage({
  clientName,
  daysSinceLastAppointment,
}: ClientFollowUpMessageInput) {
  const clientDisplayName = getClientDisplayName(clientName);

  return [
    `Olá ${clientDisplayName}, tudo bem?`,
    "",
    getLastAppointmentSentence(daysSinceLastAppointment),
    "Queria saber se você gostaria de marcar um novo atendimento.",
    "",
    "Se quiser, me responde por aqui que eu separo um horário para você.",
  ].join("\n");
}

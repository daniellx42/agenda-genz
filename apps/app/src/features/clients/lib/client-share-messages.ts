import { normalizeWhitespace } from "@/lib/formatters";

interface ClientFollowUpMessageInput {
  clientName: string;
  daysSinceLastAppointment: number;
}

interface ClientBirthdayMessageInput {
  clientName: string;
  daysUntilBirthday: number;
  turningAge: number;
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

function getBirthdaySentence(daysUntilBirthday: number) {
  if (daysUntilBirthday === 0) {
    return "Hoje é o seu aniversário. Parabéns pelo seu dia!";
  }

  if (daysUntilBirthday === 1) {
    return "Falta 1 dia para o seu aniversário.";
  }

  return `Faltam ${daysUntilBirthday} dias para o seu aniversário.`;
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

export function buildClientBirthdayMessage({
  clientName,
  daysUntilBirthday,
  turningAge,
}: ClientBirthdayMessageInput) {
  const clientDisplayName = getClientDisplayName(clientName);

  if (daysUntilBirthday === 0) {
    return [
      `Olá ${clientDisplayName}, tudo bem?`,
      "",
      "Hoje é o seu aniversário. Parabéns pelo seu dia!",
      "Quero agradecer pela sua confiança e por ser uma cliente fiel e tão especial por aqui.",
      `Espero que seus ${turningAge} anos venham com muita alegria, autoestima e momentos lindos.`,
      "Separei uma condição especial de aniversário para você aproveitar um atendimento com desconto exclusivo.",
      "",
      "Se quiser celebrar com um horário reservado para você, me responde por aqui que eu organizo tudo com carinho.",
    ].join("\n");
  }

  return [
    `Olá ${clientDisplayName}, tudo bem?`,
    "",
    getBirthdaySentence(daysUntilBirthday),
    `Quero deixar essa fase ainda mais especial e preparar um atendimento lindo para celebrar seus ${turningAge} anos.`,
    "Separei uma condição especial de aniversário para você aproveitar um desconto exclusivo no próximo serviço.",
    "",
    "Se quiser garantir seu horário, me responde por aqui que eu organizo tudo para você.",
  ].join("\n");
}

import { digitsOnly } from "@/lib/formatters";
import type { ClientDateValue } from "../types";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INPUT_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MAX_AGE = 120;

export interface ClientBirthdayDetails {
  badgeLabel: string;
  headline: string;
  supportingText: string;
  birthDateLabel: string;
  nextBirthdayLabel: string;
  daysUntilBirthday: number;
  isBirthdayMonth: boolean;
  isToday: boolean;
  turningAge: number;
}

export interface ClientBirthdayListBadge {
  label: string;
  tone: "sky" | "red";
}

function parseDateOnly(value: ClientDateValue): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  if (!DATE_ONLY_REGEX.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseBirthDateInput(value: string): Date | null {
  if (!INPUT_DATE_REGEX.test(value)) {
    return null;
  }

  const [day, month, year] = value.split("/").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnlyValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatLocalDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAgeOnDate(birthDate: Date, referenceDate: Date) {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getBirthdayOccurrence(birthDate: Date, year: number) {
  const monthIndex = birthDate.getMonth();
  const safeDay = Math.min(
    birthDate.getDate(),
    getDaysInMonth(year, monthIndex),
  );

  return new Date(year, monthIndex, safeDay);
}

function formatDaysUntilBirthdayMessage(
  daysUntilBirthday: number,
  targetLabel: string,
) {
  if (daysUntilBirthday === 0) {
    return `Hoje é o aniversário ${targetLabel}`;
  }

  const verb = daysUntilBirthday === 1 ? "Falta" : "Faltam";
  const dayLabel = daysUntilBirthday === 1 ? "dia" : "dias";

  return `${verb} ${daysUntilBirthday} ${dayLabel} para o aniversário ${targetLabel}`;
}

function getHeadline(daysUntilBirthday: number) {
  return formatDaysUntilBirthdayMessage(daysUntilBirthday, "desta cliente");
}

function getListBadgeLabel(daysUntilBirthday: number) {
  return formatDaysUntilBirthdayMessage(daysUntilBirthday, "deste cliente");
}

export function formatBirthDateInput(value: string) {
  const digits = digitsOnly(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatBirthDateInputFromValue(value?: ClientDateValue | null) {
  const parsedDate = value ? parseDateOnly(value) : null;

  if (!parsedDate) {
    return "";
  }

  return `${pad(parsedDate.getDate())}/${pad(parsedDate.getMonth() + 1)}/${parsedDate.getFullYear()}`;
}

export function toBirthDateValue(value: string, now = new Date()) {
  const parsedDate = parseBirthDateInput(value);

  if (!parsedDate) {
    return undefined;
  }

  const age = getAgeOnDate(parsedDate, now);

  if (age < 0 || age > MAX_AGE) {
    return undefined;
  }

  return toDateOnlyValue(parsedDate);
}

export function isValidBirthDateInput(value: string, now = new Date()) {
  return toBirthDateValue(value, now) !== undefined;
}

export function formatBirthDate(value: ClientDateValue) {
  const parsedDate = parseDateOnly(value);

  if (!parsedDate) {
    return String(value);
  }

  return formatLocalDate(parsedDate);
}

export function getClientBirthdayDetails(
  value: ClientDateValue,
  now = new Date(),
): ClientBirthdayDetails | null {
  const birthDate = parseDateOnly(value);

  if (!birthDate) {
    return null;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBirthday = getBirthdayOccurrence(birthDate, today.getFullYear());

  if (startOfLocalDay(nextBirthday) < startOfLocalDay(today)) {
    nextBirthday = getBirthdayOccurrence(birthDate, today.getFullYear() + 1);
  }

  const daysUntilBirthday = Math.round(
    (startOfLocalDay(nextBirthday) - startOfLocalDay(today)) / DAY_IN_MS,
  );
  const turningAge = getAgeOnDate(birthDate, nextBirthday);
  const isToday = daysUntilBirthday === 0;

  return {
    badgeLabel: `Aniversário ${nextBirthday.getFullYear()}`,
    headline: getHeadline(daysUntilBirthday),
    supportingText: isToday
      ? `Ela completa ${turningAge} anos hoje. Vale mandar parabéns, agradecer pela confiança de uma cliente fiel e aproveitar a data para convidar para um atendimento especial.`
      : `Ela vai completar ${turningAge} anos em ${formatLocalDate(nextBirthday)}. Uma boa oportunidade para oferecer um atendimento com condição especial.`,
    birthDateLabel: formatLocalDate(birthDate),
    nextBirthdayLabel: formatLocalDate(nextBirthday),
    daysUntilBirthday,
    isBirthdayMonth: today.getMonth() === birthDate.getMonth(),
    isToday,
    turningAge,
  };
}

export function getClientBirthdayListBadge(
  value: ClientDateValue,
  now = new Date(),
): ClientBirthdayListBadge | null {
  const birthDate = parseDateOnly(value);
  const details = getClientBirthdayDetails(value, now);

  if (!birthDate || !details) {
    return null;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (birthDate.getMonth() !== today.getMonth()) {
    return null;
  }

  const birthdayThisYear = getBirthdayOccurrence(birthDate, today.getFullYear());

  if (startOfLocalDay(birthdayThisYear) < startOfLocalDay(today)) {
    return null;
  }

  return {
    label: getListBadgeLabel(details.daysUntilBirthday),
    tone: details.isToday ? "red" : "sky",
  };
}

import type { DateLikeInput } from "@/lib/types/date-like";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/;

export function normalizeAppointmentDateOnly(
  value: DateLikeInput,
): string | null {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (DATE_ONLY_PATTERN.test(trimmedValue)) {
      return trimmedValue;
    }

    const datePrefix = trimmedValue.match(DATE_PREFIX_PATTERN)?.[1];
    return datePrefix ?? null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value === "object" && value !== null && "date" in value) {
    return normalizeAppointmentDateOnly(value.date);
  }

  return null;
}

function parseAppointmentDate(dateInput: DateLikeInput): Date | null {
  const normalizedInput = normalizeAppointmentDateOnly(dateInput);

  if (!normalizedInput) {
    return null;
  }

  const [yearString, monthString, dayString] = normalizedInput.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatAppointmentDate(dateInput: DateLikeInput): string {
  const date = parseAppointmentDate(dateInput);

  if (!date) {
    return "Data indisponível";
  }

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatAppointmentShortDate(dateInput: DateLikeInput): string {
  const date = parseAppointmentDate(dateInput);

  if (!date) {
    return "Data indisponível";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

import type { DateLikeInput } from "@/lib/types/date-like";

function normalizeDateInput(value: DateLikeInput): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "object" && value !== null && "date" in value) {
    return normalizeDateInput(value.date);
  }

  return null;
}

function parseAppointmentDate(dateInput: DateLikeInput): Date | null {
  const normalizedInput = normalizeDateInput(dateInput);

  if (!normalizedInput) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedInput)) {
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

  const normalizedValue = normalizedInput.includes("T")
    ? normalizedInput
    : `${normalizedInput}T12:00:00.000Z`;
  let date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    date = new Date(normalizedInput);
  }

  if (Number.isNaN(date.getTime())) {
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

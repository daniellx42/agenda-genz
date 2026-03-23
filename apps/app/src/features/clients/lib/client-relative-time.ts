const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseClientDate(value: string): Date | null {
  if (DATE_ONLY_REGEX.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    if (year === undefined || month === undefined || day === undefined) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getDaysSince(value: string, now = new Date()): number | null {
  const parsedDate = parseClientDate(value);

  if (!parsedDate) {
    return null;
  }

  const diffInMs = startOfLocalDay(now) - startOfLocalDay(parsedDate);
  return Math.max(0, Math.floor(diffInMs / DAY_IN_MS));
}

export function formatDaysLabel(days: number): string {
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

export function formatClientDate(value: string): string {
  const parsedDate = parseClientDate(value);

  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

import type { DateLikeInput } from "@/lib/types/date-like";

function normalizeDateKey(value: DateLikeInput): string | null {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  if (typeof value === "object" && value !== null && "date" in value) {
    return normalizeDateKey(value.date);
  }

  return null;
}

export function formatSelectedDay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);

  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function buildMarkedDates(
  calendarDots: Array<{ date: DateLikeInput }>,
  selectedDate: string,
) {
  const marks: Record<
    string,
    {
      marked?: boolean;
      dotColor?: string;
      selected?: boolean;
      selectedColor?: string;
      textColor?: string;
    }
  > = {};

  calendarDots.forEach(({ date }) => {
    const normalizedDate = normalizeDateKey(date);
    if (!normalizedDate) return;

    marks[normalizedDate] = {
      ...marks[normalizedDate],
      marked: true,
      dotColor: "#f43f5e",
    };
  });

  marks[selectedDate] = {
    ...marks[selectedDate],
    selected: true,
    selectedColor: "#f43f5e",
    textColor: "white",
    marked: marks[selectedDate]?.marked ?? false,
    dotColor: marks[selectedDate]?.marked ? "white" : undefined,
  };

  return marks;
}

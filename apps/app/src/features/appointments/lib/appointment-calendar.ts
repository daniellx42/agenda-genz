import type { DateLikeInput } from "@/lib/types/date-like";

const CALENDAR_BASE_HEIGHT = 68;
const CALENDAR_WEEK_HEIGHT = 54;

interface CalendarMonth {
  year: number;
  month: number;
}

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

export function getCalendarWeekCount(
  { year, month }: CalendarMonth,
  firstDay = 0,
): number {
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingDays = (monthStart - firstDay + 7) % 7;

  return Math.ceil((leadingDays + daysInMonth) / 7);
}

export function getCalendarHeight(
  currentMonth: CalendarMonth,
  firstDay = 0,
): number {
  return CALENDAR_BASE_HEIGHT + getCalendarWeekCount(currentMonth, firstDay) * CALENDAR_WEEK_HEIGHT;
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

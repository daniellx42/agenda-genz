import { addLocalDays, toLocalDateString } from "@/lib/formatters";

type ShareTimeSlot = {
  time: string;
  available: boolean;
};

type ShareTimeSlotsDay = {
  dayLabel: string;
  slots: ShareTimeSlot[];
};

function getAvailableShareDays(data: ShareTimeSlotsDay[]) {
  return data
    .map((day) => ({
      ...day,
      slots: day.slots.filter((slot) => slot.available),
    }))
    .filter((day) => day.slots.length > 0);
}

export function getRangeDates(start: string, end: string) {
  const dates: string[] = [];
  let current = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  while (toLocalDateString(current) <= toLocalDateString(endDate)) {
    dates.push(toLocalDateString(current));
    current = addLocalDays(current, 1);
  }

  return dates;
}

export function buildShareMarkedDates(
  start: string | null,
  end: string | null,
) {
  if (!start) return {};

  const lastDate = end ?? start;
  const range = getRangeDates(start, lastDate);

  return range.reduce<Record<string, object>>((accumulator, date, index) => {
    const isFirst = index === 0;
    const isLast = index === range.length - 1;

    accumulator[date] = {
      startingDay: isFirst,
      endingDay: isLast,
      color: "#f43f5e",
      textColor: "white",
    };

    if (range.length === 1) {
      accumulator[date] = {
        selected: true,
        color: "#f43f5e",
        textColor: "white",
      };
    }

    return accumulator;
  }, {});
}

export function clampShareEndDate(start: string, end: string) {
  const maxEndDate = toLocalDateString(
    addLocalDays(new Date(`${start}T12:00:00`), 6),
  );

  if (end > maxEndDate) {
    return {
      end: maxEndDate,
      didClamp: true,
    };
  }

  return {
    end,
    didClamp: false,
  };
}

export function compareMonth(
  left: { year: number; month: number },
  right: { year: number; month: number },
) {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  return left.month - right.month;
}

export function formatSelectedRange(start: string | null, end: string | null) {
  if (!start) {
    return "Selecione até 7 dias para compartilhar seus horários.";
  }

  if (!end || start === end) {
    return `Período selecionado: ${start}`;
  }

  return `Período selecionado: ${start} até ${end}`;
}

export function buildShareTimeSlotsMessage(
  data: ShareTimeSlotsDay[],
) {
  return getAvailableShareDays(data)
    .map(
      (day) =>
        `${day.dayLabel}\n${day.slots
          .map((slot) => `${slot.time} (Disponível ✅)`)
          .join("\n")}`,
    )
    .join("\n\n");
}

export function getShareTimeSlotsMessage(
  data: ShareTimeSlotsDay[],
) {
  const message = buildShareTimeSlotsMessage(data).trim();
  return message.length > 0 ? message : null;
}

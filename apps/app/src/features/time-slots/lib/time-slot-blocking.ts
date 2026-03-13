import { addLocalDays, toLocalDateString } from "@/lib/formatters";

export function getTimeSlotWeekday(dateString: string) {
  return new Date(`${dateString}T12:00:00`).getDay();
}

export function isMatchingTimeSlotDate(dateString: string, dayOfWeek: number) {
  return getTimeSlotWeekday(dateString) === dayOfWeek;
}

export function getNextTimeSlotDate(dayOfWeek: number, from = new Date()) {
  let current = new Date(`${toLocalDateString(from)}T12:00:00`);

  while (current.getDay() !== dayOfWeek) {
    current = addLocalDays(current, 1);
  }

  return toLocalDateString(current);
}

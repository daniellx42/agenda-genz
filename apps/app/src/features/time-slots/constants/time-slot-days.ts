export const TIME_SLOT_DAYS = [
  { label: "Domingo", value: 0, short: "Dom" },
  { label: "Segunda", value: 1, short: "Seg" },
  { label: "Terça", value: 2, short: "Ter" },
  { label: "Quarta", value: 3, short: "Qua" },
  { label: "Quinta", value: 4, short: "Qui" },
  { label: "Sexta", value: 5, short: "Sex" },
  { label: "Sábado", value: 6, short: "Sáb" },
] as const;

export interface TimeSlotDaySelection {
  dayOfWeek: number;
  label: string;
}

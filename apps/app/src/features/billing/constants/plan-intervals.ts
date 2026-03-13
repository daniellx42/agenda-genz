export const PLAN_DISPLAY: Record<
  string,
  { label: string; badge?: string; highlight?: boolean }
> = {
  MONTHLY: { label: "Mensal" },
  QUARTERLY: { label: "Trimestral", badge: "17% off" },
  SEMIANNUAL: { label: "Semestral", badge: "25% off" },
  ANNUAL: { label: "Anual", badge: "40% off", highlight: true },
};

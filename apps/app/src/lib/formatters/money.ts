import { digitsOnly } from "./text";

export function formatCurrency(value: string): string {
  const digits = digitsOnly(value).slice(0, 9);

  if (!digits) return "";

  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function currencyToCents(value: string): number | null {
  const digits = digitsOnly(value);
  if (!digits) return null;

  return Number(digits);
}

export function formatDuration(value: string): string {
  return digitsOnly(value).slice(0, 4);
}

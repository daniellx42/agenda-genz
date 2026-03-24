const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function normalizeDurationMonths(durationDays: number): number {
  if (durationDays >= 365) {
    return 12;
  }

  return Math.max(1, Math.round(durationDays / 30));
}

export function formatPrice(priceInCents: number): string {
  return brlFormatter.format(priceInCents / 100);
}

export function formatPerMonth(
  priceInCents: number,
  durationDays: number,
): string {
  const months = normalizeDurationMonths(durationDays);
  const perMonth = priceInCents / 100 / months;
  return `${brlFormatter.format(perMonth)}/mês`;
}

export function formatDurationLabel(durationDays: number): string {
  const months = normalizeDurationMonths(durationDays);

  if (months === 1) {
    return "1 mês";
  }

  return `${months} meses`;
}

export function formatPrice(priceInCents: number): string {
  return `R$ ${(priceInCents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatPerMonth(
  priceInCents: number,
  durationDays: number,
): string {
  const months = durationDays / 30;
  const perMonth = priceInCents / 100 / months;
  return `R$ ${perMonth.toFixed(2).replace(".", ",")}/mês`;
}

export function getAppointmentDepositAmountCents(
  price: number,
  depositPercentage: number | null,
): number | null {
  if (depositPercentage === null) {
    return null;
  }

  return Math.round(price * depositPercentage / 100);
}

export function getAppointmentRemainingAmountCents(
  price: number,
  depositPercentage: number | null,
): number | null {
  const depositAmount = getAppointmentDepositAmountCents(
    price,
    depositPercentage,
  );

  if (depositAmount === null) {
    return null;
  }

  return price - depositAmount;
}

export function getAppointmentPaidAmountCents(
  price: number,
  depositPercentage: number | null,
  paymentStatus: string,
): number {
  if (paymentStatus === "PAID") {
    return price;
  }

  if (paymentStatus === "DEPOSIT_PAID") {
    return (
      getAppointmentDepositAmountCents(price, depositPercentage) ?? price
    );
  }

  return 0;
}

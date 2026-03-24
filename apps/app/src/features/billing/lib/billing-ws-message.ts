export interface PaymentApprovedData {
  paymentId: string;
  planExpiresAt: string;
}

export interface PaymentApprovedMessage extends PaymentApprovedData {
  type: "payment_approved";
}

function isPaymentApprovedMessage(
  value: unknown,
): value is PaymentApprovedMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "payment_approved" &&
    "paymentId" in value &&
    typeof value.paymentId === "string" &&
    "planExpiresAt" in value &&
    typeof value.planExpiresAt === "string"
  );
}

export function parsePaymentApprovedMessage(
  rawMessage: string,
): PaymentApprovedMessage | null {
  try {
    const parsedMessage: unknown = JSON.parse(rawMessage);
    return isPaymentApprovedMessage(parsedMessage) ? parsedMessage : null;
  } catch {
    return null;
  }
}

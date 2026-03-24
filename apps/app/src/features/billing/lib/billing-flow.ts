export type BillingRuntimeStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface PendingCheckoutSnapshot {
  paymentId: string;
  planId: string;
  planName: string;
  amount: number;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: string;
  createdAt: string;
}

interface PixCopyStateInput {
  hasCopied: boolean;
  hasPixCode: boolean;
  isExpired: boolean;
}

export function resolveBillingStatus(
  status: BillingRuntimeStatus | null | undefined,
  pixExpiresAt: string | null | undefined,
  now = new Date(),
): BillingRuntimeStatus | null {
  if (!status) return null;

  if (
    status === "PENDING" &&
    pixExpiresAt &&
    new Date(pixExpiresAt).getTime() <= now.getTime()
  ) {
    return "EXPIRED";
  }

  return status;
}

export function hasPixQrImage(
  pixQrCodeBase64: string | null | undefined,
): boolean {
  return Boolean(pixQrCodeBase64?.trim());
}

export function isPendingCheckoutRecoverable(
  snapshot: PendingCheckoutSnapshot | null | undefined,
  now = new Date(),
): snapshot is PendingCheckoutSnapshot {
  if (!snapshot) return false;

  return resolveBillingStatus("PENDING", snapshot.pixExpiresAt, now) === "PENDING";
}

export function shouldResumePendingCheckout(
  snapshot: PendingCheckoutSnapshot | null | undefined,
  selectedPlanId: string | null,
  now = new Date(),
): boolean {
  return Boolean(
    selectedPlanId &&
      snapshot?.planId === selectedPlanId &&
      isPendingCheckoutRecoverable(snapshot, now),
  );
}

export function getPixCopyState({
  hasCopied,
  hasPixCode,
  isExpired,
}: PixCopyStateInput) {
  if (!hasPixCode || isExpired) {
    return {
      buttonLabel: "Gerar novo PIX",
      helperLabel: "Esse código não está mais disponível.",
      badgeLabel: null,
      tone: "muted" as const,
    };
  }

  if (hasCopied) {
    return {
      buttonLabel: "Código copiado",
      helperLabel: "Agora cole o código no app do seu banco para pagar.",
      badgeLabel: "Cole e pague no banco de preferência",
      tone: "success" as const,
    };
  }

  return {
    buttonLabel: "Copiar código PIX",
    helperLabel: "Copie o código e cole no app do seu banco para concluir.",
    badgeLabel: null,
    tone: "primary" as const,
  };
}

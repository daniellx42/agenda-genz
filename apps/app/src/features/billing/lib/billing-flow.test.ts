import { describe, expect, it } from "bun:test";
import {
  getPixCopyState,
  hasPixQrImage,
  resolveBillingStatus,
  shouldResumePendingCheckout,
  type PendingCheckoutSnapshot,
} from "./billing-flow";

const snapshot: PendingCheckoutSnapshot = {
  paymentId: "payment-1",
  planId: "plan-1",
  planName: "Anual",
  amount: 19990,
  pixQrCode: "000201010212",
  pixQrCodeBase64: "base64-image",
  pixExpiresAt: "2026-03-23T12:30:00.000Z",
  createdAt: "2026-03-23T12:00:00.000Z",
};

describe("resolveBillingStatus", () => {
  it("marca um PIX pendente como expirado quando o prazo acabou", () => {
    expect(
      resolveBillingStatus(
        "PENDING",
        snapshot.pixExpiresAt,
        new Date("2026-03-23T12:31:00.000Z"),
      ),
    ).toBe("EXPIRED");
  });

  it("mantém aprovado como aprovado", () => {
    expect(
      resolveBillingStatus(
        "APPROVED",
        snapshot.pixExpiresAt,
        new Date("2026-03-23T12:31:00.000Z"),
      ),
    ).toBe("APPROVED");
  });
});

describe("shouldResumePendingCheckout", () => {
  it("retoma checkout válido do mesmo plano", () => {
    expect(
      shouldResumePendingCheckout(
        snapshot,
        "plan-1",
        new Date("2026-03-23T12:10:00.000Z"),
      ),
    ).toBe(true);
  });

  it("não retoma checkout expirado", () => {
    expect(
      shouldResumePendingCheckout(
        snapshot,
        "plan-1",
        new Date("2026-03-23T12:45:00.000Z"),
      ),
    ).toBe(false);
  });

  it("não retoma checkout de outro plano", () => {
    expect(
      shouldResumePendingCheckout(
        snapshot,
        "plan-2",
        new Date("2026-03-23T12:10:00.000Z"),
      ),
    ).toBe(false);
  });
});

describe("getPixCopyState", () => {
  it("troca o CTA depois que o código foi copiado", () => {
    expect(
      getPixCopyState({
        hasCopied: true,
        hasPixCode: true,
        isExpired: false,
      }),
    ).toEqual({
      buttonLabel: "Código copiado",
      helperLabel: "Agora cole o código no app do seu banco para pagar.",
      badgeLabel: "Cole e pague no banco de preferência",
      tone: "success",
    });
  });
});

describe("hasPixQrImage", () => {
  it("confirma quando existe base64 válido", () => {
    expect(hasPixQrImage("base64")).toBe(true);
    expect(hasPixQrImage("")).toBe(false);
    expect(hasPixQrImage(null)).toBe(false);
  });
});

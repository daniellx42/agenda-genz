import { describe, expect, it } from "bun:test";
import type { PendingCheckoutSnapshot } from "./billing-flow";
import { createPendingCheckoutStorage } from "./pending-checkout-storage";

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

describe("pending-checkout-storage", () => {
  it("retorna null quando não existe checkout salvo", async () => {
    const storage = createPendingCheckoutStorage({
      setItemAsync: async () => {},
      getItemAsync: async () => null,
      deleteItemAsync: async () => {},
    });

    expect(await storage.getPendingCheckout()).toBeNull();
    expect(await storage.getPendingCheckoutById("payment-1")).toBeNull();
  });

  it("salva e recupera um checkout pendente válido", async () => {
    let storedValue: string | null = null;
    const storage = createPendingCheckoutStorage({
      setItemAsync: async (_key: string, value: string) => {
        storedValue = value;
      },
      getItemAsync: async () => storedValue,
      deleteItemAsync: async () => {},
    });

    await storage.savePendingCheckout(snapshot);

    expect(await storage.getPendingCheckout()).toEqual(snapshot);
    expect(await storage.getPendingCheckoutById("payment-1")).toEqual(snapshot);
    expect(await storage.getPendingCheckoutById("payment-2")).toBeNull();
  });

  it("limpa payload inválido salvo localmente", async () => {
    let clearCount = 0;
    const storage = createPendingCheckoutStorage({
      setItemAsync: async () => {},
      getItemAsync: async () => JSON.stringify({ paymentId: "broken" }),
      deleteItemAsync: async () => {
        clearCount += 1;
      },
    });

    expect(await storage.getPendingCheckout()).toBeNull();
    expect(clearCount).toBe(1);
  });

  it("também limpa JSON malformado", async () => {
    let clearCount = 0;
    const storage = createPendingCheckoutStorage({
      setItemAsync: async () => {},
      getItemAsync: async () => "{invalid-json",
      deleteItemAsync: async () => {
        clearCount += 1;
      },
    });

    expect(await storage.getPendingCheckout()).toBeNull();
    expect(clearCount).toBe(1);
  });

  it("ignora erros do SecureStore sem quebrar o fluxo", async () => {
    const storage = createPendingCheckoutStorage({
      setItemAsync: async () => {
        throw new Error("store unavailable");
      },
      getItemAsync: async () => {
        throw new Error("store unavailable");
      },
      deleteItemAsync: async () => {
        throw new Error("store unavailable");
      },
    });

    await expect(storage.savePendingCheckout(snapshot)).resolves.toBeUndefined();
    await expect(storage.getPendingCheckout()).resolves.toBeNull();
    await expect(storage.clearPendingCheckout()).resolves.toBeUndefined();
  });
});

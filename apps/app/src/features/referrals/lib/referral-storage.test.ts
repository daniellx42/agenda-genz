import { describe, expect, it } from "bun:test";
import {
  buildDeferredReferralReminderSnapshot,
  createReferralStorage,
  getDefaultReferralReminderSnapshot,
  shouldShowReferralReminder,
} from "./referral-storage";

describe("referral-storage", () => {
  it("retorna um snapshot inicial quando ainda não existe lembrete salvo", async () => {
    const storage = createReferralStorage({
      getItemAsync: async () => null,
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    });

    const snapshot = await storage.getReminderSnapshot("user-1");

    expect(snapshot).not.toBeNull();
    expect(snapshot?.lastPromptAt).toBeNull();
    expect(shouldShowReferralReminder(snapshot!, new Date(snapshot!.nextPromptAt))).toBe(true);
  });

  it("salva e recupera o lembrete do programa de convite", async () => {
    let storedReminder: string | null = null;
    const storage = createReferralStorage({
      getItemAsync: async () => storedReminder,
      setItemAsync: async (_key, value) => {
        storedReminder = value;
      },
      deleteItemAsync: async () => {},
    });
    const snapshot = buildDeferredReferralReminderSnapshot(
      21,
      new Date("2026-03-25T12:00:00.000Z"),
    );

    await storage.saveReminderSnapshot("user-1", snapshot);

    expect(await storage.getReminderSnapshot("user-1")).toEqual(snapshot);
  });

  it("salva e recupera a chave pix local por usuário", async () => {
    let storedPixKey: string | null = null;
    let storedPromptSeen: string | null = null;
    const storage = createReferralStorage({
      getItemAsync: async (key) => {
        if (key.includes("pix-key")) {
          return storedPixKey;
        }

        if (key.includes("prompt-seen")) {
          return storedPromptSeen;
        }

        return null;
      },
      setItemAsync: async (key, value) => {
        if (key.includes("pix-key")) {
          storedPixKey = value;
          return;
        }

        if (key.includes("prompt-seen")) {
          storedPromptSeen = value;
        }
      },
      deleteItemAsync: async (key) => {
        if (key.includes("pix-key")) {
          storedPixKey = null;
        }

        if (key.includes("prompt-seen")) {
          storedPromptSeen = null;
        }
      },
    });

    await storage.savePixKey("user-1", "user@test.com");
    expect(await storage.getPixKey("user-1")).toBe("user@test.com");

    await storage.clearPixKey("user-1");
    expect(await storage.getPixKey("user-1")).toBeNull();
  });

  it("salva e recupera se o prompt de convite já foi exibido", async () => {
    let storedPromptSeen: string | null = null;
    const storage = createReferralStorage({
      getItemAsync: async () => storedPromptSeen,
      setItemAsync: async (_key, value) => {
        storedPromptSeen = value;
      },
      deleteItemAsync: async () => {
        storedPromptSeen = null;
      },
    });

    expect(await storage.getHasSeenPrompt("user-1")).toBe(false);

    await storage.markPromptSeen("user-1");
    expect(await storage.getHasSeenPrompt("user-1")).toBe(true);

    await storage.clearPromptSeen("user-1");
    expect(await storage.getHasSeenPrompt("user-1")).toBe(false);
  });

  it("faz fallback para o snapshot padrão se o JSON estiver inválido", async () => {
    const storage = createReferralStorage({
      getItemAsync: async () => "{invalid-json",
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    });

    expect(await storage.getReminderSnapshot("user-1")).toEqual(
      getDefaultReferralReminderSnapshot(),
    );
  });
});

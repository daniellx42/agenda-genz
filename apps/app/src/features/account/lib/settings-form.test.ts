import { describe, expect, it } from "bun:test";
import {
  DELETE_ACCOUNT_CONFIRMATION_TEXT,
  canDeleteAccountWithConfirmation,
  canSaveDisplayName,
  getTrimmedDisplayName,
  normalizeDeletionConfirmation,
} from "./settings-form";

describe("settings-form", () => {
  it("normaliza a confirmação de deleção", () => {
    expect(normalizeDeletionConfirmation("  Quero   Deletar Minha Conta ")).toBe(
      DELETE_ACCOUNT_CONFIRMATION_TEXT,
    );
  });

  it("valida corretamente a frase de confirmação", () => {
    expect(canDeleteAccountWithConfirmation("quero deletar minha conta")).toBe(
      true,
    );
    expect(canDeleteAccountWithConfirmation("deletar conta")).toBe(false);
  });

  it("normaliza o nome antes de salvar", () => {
    expect(getTrimmedDisplayName("  Maria   Silva  ")).toBe("Maria Silva");
  });

  it("só permite salvar quando o nome mudou e continua válido", () => {
    expect(canSaveDisplayName("  Maria   Silva  ", "Maria")).toBe(true);
    expect(canSaveDisplayName("Ma", "Ma")).toBe(false);
    expect(canSaveDisplayName(" A ", "Maria")).toBe(false);
  });
});

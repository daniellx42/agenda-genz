import { describe, expect, it } from "bun:test";
import {
  getApiErrorAction,
  getApiErrorMessage,
} from "./api-error-actions";

describe("use-api-error helpers", () => {
  it("classifica 402 como redirecionamento para o paywall", () => {
    expect(
      getApiErrorAction({
        status: 402,
        message: "Plano expirado. Renove sua assinatura.",
      }),
    ).toEqual({ type: "plan_expired" });
  });

  it("classifica pagamento já processado como retorno para a agenda", () => {
    expect(
      getApiErrorAction({
        message: "Pagamento já processado",
      }),
    ).toEqual({ type: "payment_already_processed" });
  });

  it("mantém erros genéricos como toast", () => {
    expect(
      getApiErrorAction({
        value: {
          message: "Não foi possível verificar o pagamento agora",
        },
      }),
    ).toEqual({
      type: "toast",
      message: "Não foi possível verificar o pagamento agora",
    });
  });

  it("resolve mensagens em Error, string e value.message do Eden", () => {
    expect(getApiErrorMessage(new Error("Falha direta"))).toBe("Falha direta");
    expect(getApiErrorMessage("Erro em texto")).toBe("Erro em texto");
    expect(
      getApiErrorMessage({
        value: {
          message: "Mensagem encapsulada",
        },
      }),
    ).toBe("Mensagem encapsulada");
  });

  it("resolve mensagem padrão quando o erro é desconhecido", () => {
    expect(getApiErrorMessage(null)).toBe("Erro inesperado");
  });
});

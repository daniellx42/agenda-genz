import { beforeEach, describe, expect, it, mock } from "bun:test";

function loadBillingQueryOptionsModule() {
  return import(`./billing-query-options?test=${Date.now()}-${Math.random()}`);
}

beforeEach(() => {
  mock.restore();
});

describe("billing-query-options", () => {
  it("consulta os planos com cache estável para a tela de paywall", async () => {
    const plansGet = mock(async () => ({
      data: [
        {
          id: "plan-1",
          name: "Anual",
        },
      ],
      error: null,
    }));

    mock.module("@/lib/api", () => ({
      api: {
        api: {
          billing: {
            plans: {
              get: plansGet,
            },
            payments: mock(() => ({
              get: mock(async () => ({ data: null, error: null })),
            })),
          },
        },
      },
    }));

    const billing = await loadBillingQueryOptionsModule();
    const options = billing.billingPlansQueryOptions();
    const plans = await options.queryFn();

    expect(plans).toEqual([{ id: "plan-1", name: "Anual" }]);
    expect(options.queryKey).toEqual(["billing", "plans"]);
    expect(options.staleTime).toBe(1000 * 60 * 5);
    expect(options.retry).toBe(2);
    expect(plansGet).toHaveBeenCalledTimes(1);
  });

  it("não consulta status quando paymentId é indefinido", async () => {
    const paymentsFactory = mock(() => ({
      get: mock(async () => ({
        data: null,
        error: null,
      })),
    }));

    mock.module("@/lib/api", () => ({
      api: {
        api: {
          billing: {
            plans: {
              get: mock(async () => ({ data: [], error: null })),
            },
            payments: paymentsFactory,
          },
        },
      },
    }));

    const billing = await loadBillingQueryOptionsModule();

    expect(await billing.fetchBillingPaymentStatus(undefined)).toBeNull();
    expect(paymentsFactory).not.toHaveBeenCalled();
  });

  it("consulta o status do pagamento e mantém a query sem polling contínuo", async () => {
    const paymentGet = mock(async () => ({
      data: {
        id: "payment-1",
        status: "PENDING",
        planName: "Anual",
        amount: 19990,
        paidAt: null,
        expiresAt: null,
        pixExpiresAt: "2026-03-23T12:30:00.000Z",
      },
      error: null,
    }));
    const paymentsFactory = mock((_params: { id: string }) => ({
      get: paymentGet,
    }));

    mock.module("@/lib/api", () => ({
      api: {
        api: {
          billing: {
            plans: {
              get: mock(async () => ({ data: [], error: null })),
            },
            payments: paymentsFactory,
          },
        },
      },
    }));

    const billing = await loadBillingQueryOptionsModule();
    const result = await billing.fetchBillingPaymentStatus("payment-1");
    const options = billing.billingPaymentStatusQueryOptions("payment-1");

    expect(result?.id).toBe("payment-1");
    expect(paymentsFactory).toHaveBeenCalledWith({ id: "payment-1" });
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(1);
    expect(options.refetchInterval).toBeUndefined();
  });
});

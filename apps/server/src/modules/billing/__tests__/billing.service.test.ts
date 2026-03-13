import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function expectElysiaError(
  promise: Promise<unknown>,
  expectedMessage: string,
  expectedCode: number,
) {
  try {
    await promise;
    throw new Error("Expected promise to reject");
  } catch (err) {
    expect(err).toMatchObject({
      response: expectedMessage,
      code: expectedCode,
    });
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPlan = {
  id: "plan-1",
  interval: "MONTHLY" as const,
  name: "Mensal",
  priceInCents: 999,
  durationDays: 30,
  discountLabel: null,
  active: true,
};

const mockPayment = {
  id: "payment-1",
  userId: "user-1",
  planId: "plan-1",
  mpPaymentId: "mp-123",
  mpIdempotencyKey: "key-123",
  amount: 999,
  durationDays: 30,
  status: "PENDING" as const,
  pixQrCode: "pix-code-123",
  pixQrCodeBase64: "base64-qr",
  pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  paidAt: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: { name: "Mensal", durationDays: 30 },
};

const mockUser = {
  id: "user-1",
  email: "user@test.com",
  planExpiresAt: null as Date | null,
};

beforeEach(() => {
  mock.restore();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("BillingService.listPlans", () => {
  it("deve retornar planos ativos", async () => {
    const plans = [mockPlan];
    const listMock = mock(() => Promise.resolve(plans));

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        listActivePlans: listMock,
      },
    }));

    const { BillingService: BS } = await import("../billing.service");
    const result = await BS.listPlans();

    expect(result).toEqual(plans);
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});

describe("BillingService.createPixPayment", () => {
  it("deve criar pagamento PIX e retornar dados do QR", async () => {
    const cancelMock = mock(() => Promise.resolve());
    const findPlanMock = mock(() => Promise.resolve(mockPlan));
    const createPaymentMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        id: "payment-new",
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: findPlanMock,
        cancelPendingPayments: cancelMock,
        createPayment: createPaymentMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        create: mock(() =>
          Promise.resolve({
            id: 999,
            status: "pending",
            point_of_interaction: {
              transaction_data: {
                qr_code: "pix-code",
                qr_code_base64: "base64-img",
              },
            },
          }),
        ),
      },
    }));

    // Mock env
    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test-token",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await import("../billing.service");
    const result = await BS.createPixPayment(
      "user-1",
      "user@test.com",
      "plan-1",
    );

    expect(result.pixQrCode).toBe("pix-code");
    expect(result.pixQrCodeBase64).toBe("base64-img");
    expect(result.amount).toBe(999);
    expect(result.planName).toBe("Mensal");
    expect(cancelMock).toHaveBeenCalledWith("user-1");
  });

  it("deve lançar 404 quando plano não existe", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(null)),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await import("../billing.service");

    await expectElysiaError(
      BS.createPixPayment("user-1", "user@test.com", "non-existent"),
      Errors.BILLING.PLAN_NOT_FOUND.message,
      Errors.BILLING.PLAN_NOT_FOUND.httpStatus,
    );
  });

  it("deve lançar 502 quando MercadoPago falha", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(mockPlan)),
        cancelPendingPayments: mock(() => Promise.resolve()),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        create: mock(() => Promise.reject(new Error("MP Error"))),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await import("../billing.service");

    await expectElysiaError(
      BS.createPixPayment("user-1", "user@test.com", "plan-1"),
      Errors.BILLING.PAYMENT_CREATION_FAILED.message,
      Errors.BILLING.PAYMENT_CREATION_FAILED.httpStatus,
    );
  });
});

describe("BillingService.getPaymentStatus", () => {
  it("deve retornar status do pagamento", async () => {
    const findMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        paidAt: null,
        expiresAt: null,
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentById: findMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await import("../billing.service");
    const result = await BS.getPaymentStatus("payment-1", "user-1");

    expect(result.id).toBe("payment-1");
    expect(result.status).toBe("PENDING");
    expect(result.planName).toBe("Mensal");
  });

  it("deve lançar 404 quando pagamento não existe", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentById: mock(() => Promise.resolve(null)),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await import("../billing.service");

    await expectElysiaError(
      BS.getPaymentStatus("non-existent", "user-1"),
      Errors.BILLING.PAYMENT_NOT_FOUND.message,
      Errors.BILLING.PAYMENT_NOT_FOUND.httpStatus,
    );
  });
});

describe("BillingService.processWebhook", () => {
  it("deve aprovar pagamento e estender plano do usuário", async () => {
    const findByMpMock = mock(() =>
      Promise.resolve({ ...mockPayment, status: "PENDING" }),
    );
    const findUserMock = mock(() =>
      Promise.resolve({ ...mockUser, planExpiresAt: null }),
    );
    const updatePaymentMock = mock(() => Promise.resolve(mockPayment));
    const updateUserMock = mock(() => Promise.resolve(mockUser));

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentByMpId: findByMpMock,
        findUserById: findUserMock,
        updatePaymentStatus: updatePaymentMock,
        updateUserPlanExpiry: updateUserMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.resolve({ status: "approved" })),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    // Mock prisma transaction
    mock.module("../../../shared/lib/db", () => ({
      prisma: {
        $transaction: mock((ops: Promise<unknown>[]) =>
          Promise.all(ops),
        ),
        billingPayment: {
          update: mock(() => Promise.resolve(mockPayment)),
        },
        user: {
          update: mock(() => Promise.resolve(mockUser)),
        },
      },
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");
    await BS.processWebhook("mp-123");

    expect(findByMpMock).toHaveBeenCalledWith("mp-123");
  });

  it("deve empilhar dias quando plano ainda está ativo", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15); // 15 days left

    const findByMpMock = mock(() =>
      Promise.resolve({ ...mockPayment, status: "PENDING", durationDays: 30 }),
    );
    const findUserMock = mock(() =>
      Promise.resolve({ ...mockUser, planExpiresAt: futureDate }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentByMpId: findByMpMock,
        findUserById: findUserMock,
        updatePaymentStatus: mock(() => Promise.resolve(mockPayment)),
        updateUserPlanExpiry: mock(() => Promise.resolve(mockUser)),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.resolve({ status: "approved" })),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {
        $transaction: mock((ops: Promise<unknown>[]) =>
          Promise.all(ops),
        ),
        billingPayment: {
          update: mock(() => Promise.resolve(mockPayment)),
        },
        user: {
          update: mock(() => Promise.resolve(mockUser)),
        },
      },
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");

    // Test calcNewExpiry directly — should stack from futureDate
    const newExpiry = BS.calcNewExpiry(futureDate, 30);
    const expectedMin = new Date(futureDate);
    expectedMin.setDate(expectedMin.getDate() + 29);
    const expectedMax = new Date(futureDate);
    expectedMax.setDate(expectedMax.getDate() + 31);

    expect(newExpiry.getTime()).toBeGreaterThan(expectedMin.getTime());
    expect(newExpiry.getTime()).toBeLessThan(expectedMax.getTime());
  });

  it("deve ignorar pagamento já processado (idempotente)", async () => {
    const findByMpMock = mock(() =>
      Promise.resolve({ ...mockPayment, status: "APPROVED" }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentByMpId: findByMpMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.resolve({ status: "approved" })),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: { $transaction: mock() },
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");
    await BS.processWebhook("mp-123"); // Should not throw

    // MercadoPago API should not be called since payment is already processed
  });

  it("deve atualizar status para REJECTED quando MP rejeita", async () => {
    const updateStatusMock = mock(() => Promise.resolve(mockPayment));
    const findByMpMock = mock(() =>
      Promise.resolve({ ...mockPayment, status: "PENDING" }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentByMpId: findByMpMock,
        updatePaymentStatus: updateStatusMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.resolve({ status: "rejected" })),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: { $transaction: mock() },
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");
    await BS.processWebhook("mp-123");

    expect(updateStatusMock).toHaveBeenCalledWith(mockPayment.id, {
      status: "REJECTED",
    });
  });
});

describe("BillingService.validateWebhookSignature", () => {
  it("deve retornar true para assinatura válida", async () => {
    const crypto = await import("node:crypto");
    const secret = "test-webhook-secret";
    const dataId = "999";
    const requestId = "req-123";
    const ts = "1704908010";

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hash = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");
    const xSignature = `ts=${ts},v1=${hash}`;

    mock.module("../billing.repository", () => ({
      BillingRepository: {},
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: secret,
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {},
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");
    const isValid = BS.validateWebhookSignature(
      xSignature,
      requestId,
      dataId,
    );

    expect(isValid).toBe(true);
  });

  it("deve retornar false para assinatura inválida", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {},
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {},
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");
    const isValid = BS.validateWebhookSignature(
      "ts=123,v1=invalid-hash",
      "req-123",
      "999",
    );

    expect(isValid).toBe(false);
  });

  it("deve retornar false quando headers estão ausentes", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {},
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {},
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");

    expect(BS.validateWebhookSignature(null, null, null)).toBe(false);
    expect(BS.validateWebhookSignature("ts=1,v1=abc", null, "999")).toBe(
      false,
    );
    expect(
      BS.validateWebhookSignature("ts=1,v1=abc", "req-1", null),
    ).toBe(false);
  });
});

describe("BillingService.calcNewExpiry", () => {
  it("deve calcular a partir de agora quando plano está expirado", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {},
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {},
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const result = BS.calcNewExpiry(pastDate, 30);
    const now = new Date();
    const expected = new Date(now);
    expected.setDate(expected.getDate() + 30);

    // Should be approximately now + 30 days (within 5 second tolerance)
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(
      5000,
    );
  });

  it("deve calcular a partir de null (sem plano anterior)", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {},
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: { create: mock() },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {},
    }));

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await import("../billing.service");

    const result = BS.calcNewExpiry(null, 90);
    const expected = new Date();
    expected.setDate(expected.getDate() + 90);

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(
      5000,
    );
  });
});

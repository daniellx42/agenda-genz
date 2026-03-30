import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadBillingService() {
  return import(`../billing.service?test=${Date.now()}-${Math.random()}`);
}

async function expectElysiaError<T>(
  promise: Promise<T>,
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

function mockPrismaInteractiveTransaction(options?: {
  billingPaymentResult?: unknown;
  userResult?: unknown;
  referralRewardCount?: number;
}) {
  const billingPaymentUpdateMock = mock(() =>
    Promise.resolve(options?.billingPaymentResult ?? mockPayment),
  );
  const userUpdateMock = mock(() =>
    Promise.resolve(options?.userResult ?? mockUser),
  );
  const referralUseUpdateManyMock = mock(() =>
    Promise.resolve({ count: options?.referralRewardCount ?? 0 }),
  );
  const tx = {
    billingPayment: {
      update: billingPaymentUpdateMock,
    },
    user: {
      update: userUpdateMock,
    },
    referralUse: {
      updateMany: referralUseUpdateManyMock,
    },
  };
  type TxType = typeof tx;
  const transactionMock = mock(async <T>(
    callback: (tx: TxType) => Promise<T>,
  ) => callback(tx));

  mock.module("../../../shared/lib/db", () => ({
    prisma: {
      $transaction: transactionMock,
    },
  }));

  return {
    billingPaymentUpdateMock,
    referralUseUpdateManyMock,
    transactionMock,
    tx,
    userUpdateMock,
  };
}

beforeEach(() => {
  mock.restore();
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  mock.module("../../referrals/referral.service", () => ({
    ReferralService: {
      grantOwnerRewardForApprovedPayment: mock(() => Promise.resolve()),
    },
  }));
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

    const { BillingService: BS } = await loadBillingService();
    const result = await BS.listPlans();

    expect(result).toEqual(plans);
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});

describe("BillingService.createPixPayment", () => {
  it("deve reaproveitar um PIX pendente válido do mesmo plano", async () => {
    const findPlanMock = mock(() => Promise.resolve(mockPlan));
    const findResumablePaymentMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        id: "payment-existing",
        pixExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }),
    );
    const cancelPendingMock = mock(() => Promise.resolve());
    const createPaymentMock = mock(() => Promise.resolve(mockPayment));
    const createMpPaymentMock = mock(() =>
      Promise.resolve({
        id: 999,
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: findPlanMock,
        findResumablePendingPayment: findResumablePaymentMock,
        findPendingPaymentsByUserId: cancelPendingMock,
        createPayment: createPaymentMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        create: createMpPaymentMock,
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test-token",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();
    const result = await BS.createPixPayment(
      "user-1",
      "user@test.com",
      "plan-1",
    );

    expect(result.paymentId).toBe("payment-existing");
    expect(findResumablePaymentMock).toHaveBeenCalledWith("user-1", "plan-1");
    expect(cancelPendingMock).not.toHaveBeenCalled();
    expect(createPaymentMock).not.toHaveBeenCalled();
    expect(createMpPaymentMock).not.toHaveBeenCalled();
  });

  it("deve criar pagamento PIX e retornar dados do QR", async () => {
    const cancelMock = mock(() => Promise.resolve([]));
    const findPlanMock = mock(() => Promise.resolve(mockPlan));
    const findResumablePaymentMock = mock(() => Promise.resolve(null));
    const createPaymentMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        id: "payment-new",
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: findPlanMock,
        findResumablePendingPayment: findResumablePaymentMock,
        findPendingPaymentsByUserId: cancelMock,
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

    const { BillingService: BS } = await loadBillingService();
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

  it("deve cancelar PIXs pendentes anteriores no Mercado Pago antes de criar outro", async () => {
    const cancelMpPaymentMock = mock(() =>
      Promise.resolve({
        status: "cancelled",
      }),
    );
    const updatePaymentStatusMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        status: "CANCELLED" as const,
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(mockPlan)),
        findResumablePendingPayment: mock(() => Promise.resolve(null)),
        findPendingPaymentsByUserId: mock(() =>
          Promise.resolve([
            {
              ...mockPayment,
              id: "payment-old",
              mpPaymentId: "mp-old",
            },
          ]),
        ),
        updatePaymentStatus: updatePaymentStatusMock,
        createPayment: mock(() =>
          Promise.resolve({
            ...mockPayment,
            id: "payment-new",
          }),
        ),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        cancel: cancelMpPaymentMock,
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

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test-token",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();
    await BS.createPixPayment("user-1", "user@test.com", "plan-1");

    expect(cancelMpPaymentMock).toHaveBeenCalledWith({ id: Number("mp-old") });
    expect(updatePaymentStatusMock).toHaveBeenCalledWith("payment-old", {
      status: "CANCELLED",
    });
  });

  it("deve impedir novo PIX quando o anterior já foi aprovado durante a troca", async () => {
    const findUserMock = mock(() =>
      Promise.resolve({ ...mockUser, planExpiresAt: null }),
    );
    const notifyPaymentApprovedMock = mock();

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(mockPlan)),
        findResumablePendingPayment: mock(() => Promise.resolve(null)),
        findPendingPaymentsByUserId: mock(() =>
          Promise.resolve([
            {
              ...mockPayment,
              id: "payment-old",
              mpPaymentId: "mp-old",
              status: "PENDING" as const,
            },
          ]),
        ),
        findUserById: findUserMock,
        updatePaymentStatus: mock(() =>
          Promise.resolve({
            ...mockPayment,
            id: "payment-old",
            status: "APPROVED" as const,
            paidAt: new Date(),
          }),
        ),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        cancel: mock(() => Promise.reject(new Error("already approved"))),
        get: mock(() => Promise.resolve({ status: "approved" })),
        create: mock(),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test-token",
        MERCADO_PAGO_WEBHOOK_SECRET: "test-secret",
        SERVER_URL: "https://test.com",
      },
    }));

    mockPrismaInteractiveTransaction({
      billingPaymentResult: {
        ...mockPayment,
        id: "payment-old",
        status: "APPROVED" as const,
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      userResult: {
        ...mockUser,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: notifyPaymentApprovedMock,
    }));

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.createPixPayment("user-1", "user@test.com", "plan-1"),
      Errors.BILLING.PAYMENT_ALREADY_PROCESSED.message,
      Errors.BILLING.PAYMENT_ALREADY_PROCESSED.httpStatus,
    );
  });

  it("deve lançar 404 quando plano não existe", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(null)),
        findResumablePendingPayment: mock(() => Promise.resolve(null)),
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

    const { BillingService: BS } = await loadBillingService();

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
        findResumablePendingPayment: mock(() => Promise.resolve(null)),
        findPendingPaymentsByUserId: mock(() => Promise.resolve([])),
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

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.createPixPayment("user-1", "user@test.com", "plan-1"),
      Errors.BILLING.PAYMENT_CREATION_FAILED.message,
      Errors.BILLING.PAYMENT_CREATION_FAILED.httpStatus,
    );
  });

  it("deve lançar 502 quando não consegue invalidar um PIX anterior", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPlanById: mock(() => Promise.resolve(mockPlan)),
        findResumablePendingPayment: mock(() => Promise.resolve(null)),
        findPendingPaymentsByUserId: mock(() =>
          Promise.resolve([
            {
              ...mockPayment,
              id: "payment-old",
              mpPaymentId: "mp-old",
              status: "PENDING" as const,
            },
          ]),
        ),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        cancel: mock(() => Promise.reject(new Error("cancel failed"))),
        get: mock(() => Promise.reject(new Error("get failed"))),
        create: mock(),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.createPixPayment("user-1", "user@test.com", "plan-1"),
      Errors.BILLING.PAYMENT_CANCELLATION_FAILED.message,
      Errors.BILLING.PAYMENT_CANCELLATION_FAILED.httpStatus,
    );
  });
});

describe("BillingService.getPaymentStatus", () => {
  it("deve retornar status do pagamento", async () => {
    const findMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        status: "APPROVED",
        paidAt: new Date("2026-03-23T12:00:00.000Z"),
        expiresAt: new Date("2026-04-22T12:00:00.000Z"),
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

    const { BillingService: BS } = await loadBillingService();
    const result = await BS.getPaymentStatus("payment-1", "user-1");

    expect(result.id).toBe("payment-1");
    expect(result.status).toBe("APPROVED");
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

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.getPaymentStatus("non-existent", "user-1"),
      Errors.BILLING.PAYMENT_NOT_FOUND.message,
      Errors.BILLING.PAYMENT_NOT_FOUND.httpStatus,
    );
  });

  it("deve reconciliar pagamento pendente aprovado com Mercado Pago", async () => {
    const payment = {
      ...mockPayment,
      status: "PENDING" as const,
      expiresAt: null,
      paidAt: null,
    };
    const futureExpiry = new Date("2026-04-22T12:00:00.000Z");

    const findPaymentMock = mock(() => Promise.resolve(payment));
    const findUserMock = mock(() =>
      Promise.resolve({ ...mockUser, planExpiresAt: null }),
    );
    const notifyPaymentApprovedMock = mock();

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentById: findPaymentMock,
        findUserById: findUserMock,
        updatePaymentStatus: mock(() => Promise.resolve(mockPayment)),
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

    mockPrismaInteractiveTransaction({
      billingPaymentResult: {
        ...payment,
        status: "APPROVED",
        paidAt: new Date("2026-03-23T12:00:00.000Z"),
        expiresAt: futureExpiry,
      },
      userResult: {
        ...mockUser,
        planExpiresAt: futureExpiry,
      },
    });

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: notifyPaymentApprovedMock,
    }));

    const { BillingService: BS } = await loadBillingService();
    const result = await BS.getPaymentStatus("payment-1", "user-1");
    const expectedExpiry = new Date();
    expectedExpiry.setDate(expectedExpiry.getDate() + 30);

    expect(result.status).toBe("APPROVED");
    expect(result.expiresAt).not.toBeNull();
    expect(
      Math.abs(
        new Date(result.expiresAt!).getTime() - expectedExpiry.getTime(),
      ),
    ).toBeLessThan(5000);
    expect(notifyPaymentApprovedMock).toHaveBeenCalledWith("user-1", {
      paymentId: "payment-1",
      planExpiresAt: result.expiresAt!,
    });
  });

  it("deve marcar pagamento pendente como expirado quando o PIX venceu", async () => {
    const expiredPix = new Date(Date.now() - 5 * 60 * 1000);
    const updatePaymentStatusMock = mock(() =>
      Promise.resolve({
        ...mockPayment,
        status: "EXPIRED" as const,
        pixExpiresAt: expiredPix,
      }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentById: mock(() =>
          Promise.resolve({
            ...mockPayment,
            status: "PENDING" as const,
            pixExpiresAt: expiredPix,
          }),
        ),
        updatePaymentStatus: updatePaymentStatusMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.resolve({ status: "pending" })),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();
    const result = await BS.getPaymentStatus("payment-1", "user-1");

    expect(result.status).toBe("EXPIRED");
    expect(updatePaymentStatusMock).toHaveBeenCalledWith("payment-1", {
      status: "EXPIRED",
    });
  });

  it("deve lançar 502 quando não consegue sincronizar um pagamento pendente", async () => {
    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentById: mock(() =>
          Promise.resolve({
            ...mockPayment,
            status: "PENDING" as const,
          }),
        ),
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.reject(new Error("MP unavailable"))),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.getPaymentStatus("payment-1", "user-1"),
      Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED.message,
      Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED.httpStatus,
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
    mockPrismaInteractiveTransaction();

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await loadBillingService();
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

    mockPrismaInteractiveTransaction();

    mock.module("../billing.ws", () => ({
      notifyPaymentApproved: mock(),
    }));

    const { BillingService: BS } = await loadBillingService();

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

    const { BillingService: BS } = await loadBillingService();
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

    const { BillingService: BS } = await loadBillingService();
    await BS.processWebhook("mp-123");

    expect(updateStatusMock).toHaveBeenCalledWith(mockPayment.id, {
      status: "REJECTED",
    });
  });

  it("deve falhar para o Mercado Pago tentar novamente quando não consegue verificar o webhook", async () => {
    const findByMpMock = mock(() =>
      Promise.resolve({ ...mockPayment, status: "PENDING" }),
    );

    mock.module("../billing.repository", () => ({
      BillingRepository: {
        findPaymentByMpId: findByMpMock,
      },
    }));

    mock.module("../../../shared/lib/mercadopago", () => ({
      mpPayment: {
        get: mock(() => Promise.reject(new Error("MP offline"))),
      },
    }));

    mock.module("@agenda-genz/env/server", () => ({
      env: {
        MERCADO_PAGO_ACCESS_TOKEN: "test",
        MERCADO_PAGO_WEBHOOK_SECRET: "test",
        SERVER_URL: "https://test.com",
      },
    }));

    const { BillingService: BS } = await loadBillingService();

    await expectElysiaError(
      BS.processWebhook("mp-123"),
      Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED.message,
      Errors.BILLING.PAYMENT_STATUS_SYNC_FAILED.httpStatus,
    );
  });
});

describe("BillingService.validateWebhookSignature", () => {
  it("deve retornar true para assinatura válida", async () => {
    const crypto = await import("node:crypto");
    const secret = "test-webhook-secret";
    const dataId = "999";
    const requestId = "req-123";
    const ts = "1704908010";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;

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

    const { BillingService: BS } = await loadBillingService();
    const isValid = BS.validateWebhookSignature(
      xSignature,
      requestId,
      dataId,
    );

    expect(isValid).toBe(true);
  });

  it("deve retornar false para assinatura inválida", async () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";

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

    const { BillingService: BS } = await loadBillingService();
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

    const { BillingService: BS } = await loadBillingService();

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

    const { BillingService: BS } = await loadBillingService();

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

    const { BillingService: BS } = await loadBillingService();

    const result = BS.calcNewExpiry(null, 90);
    const expected = new Date();
    expected.setDate(expected.getDate() + 90);

    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(
      5000,
    );
  });
});

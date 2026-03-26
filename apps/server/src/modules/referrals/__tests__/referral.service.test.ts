import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

function loadReferralService() {
  return import(`../referral.service?test=${Date.now()}-${Math.random()}`);
}

async function expectElysiaError<T>(
  promise: Promise<T>,
  expectedMessage: string,
  expectedCode: number,
) {
  try {
    await promise;
    throw new Error("Expected promise to reject");
  } catch (error) {
    expect(error).toMatchObject({
      response: expectedMessage,
      code: expectedCode,
    });
  }
}

const now = new Date("2026-03-25T12:00:00.000Z");

const referralCode = {
  id: "referral-code-1",
  userId: "owner-1",
  code: "ABC12345",
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  mock.restore();
  mock.module("../../../shared/lib/db", () => ({
    prisma: {
      $transaction: mock(async (callback?: (tx: object) => Promise<unknown>) => {
        if (!callback) {
          return null;
        }

        return callback({});
      }),
    },
  }));
});

describe("ReferralService.getSummary", () => {
  it("retorna estado padrão quando o usuário ainda não participa", async () => {
    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        findCodeByUserId: mock(() => Promise.resolve(null)),
        findUseByInvitedUserId: mock(() => Promise.resolve(null)),
        countGrantedOwnerRewards: mock(() => Promise.resolve(0)),
        countGrantedInvitedRewards: mock(() => Promise.resolve(0)),
        sumReservedWithdrawals: mock(() => Promise.resolve(0)),
        countReferralUsersByOwner: mock(() => Promise.resolve(0)),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.getSummary("user-1");

    expect(result).toEqual({
      referralCode: null,
      availableBalanceInCents: 0,
      referralUsersCount: 0,
      rewardAmountInCents: 100,
      minWithdrawalAmountInCents: 10_000,
      canWithdraw: false,
      promptStatus: "PENDING",
    });
  });
});

describe("ReferralService.generateCode", () => {
  it("reaproveita o código existente do usuário", async () => {
    const findCodeByUserIdMock = mock(() => Promise.resolve(referralCode));
    const createCodeMock = mock(() => Promise.resolve(referralCode));

    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        findCodeByUserId: findCodeByUserIdMock,
        createCode: createCodeMock,
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.generateCode("owner-1");

    expect(result).toEqual({ code: "ABC12345" });
    expect(createCodeMock).not.toHaveBeenCalled();
  });
});

describe("ReferralService.applyCode", () => {
  it("impede usar o próprio código", async () => {
    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        findUseByInvitedUserId: mock(() => Promise.resolve(null)),
        findActiveCodeByCode: mock(() => Promise.resolve(referralCode)),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();

    await expectElysiaError(
      RS.applyCode("owner-1", "ABC12345"),
      Errors.REFERRAL.SELF_REFERRAL_FORBIDDEN.message,
      Errors.REFERRAL.SELF_REFERRAL_FORBIDDEN.httpStatus,
    );
  });

  it("registra o uso de um código válido e devolve a recompensa", async () => {
    const createAppliedUseMock = mock(() =>
      Promise.resolve({
        id: "referral-use-1",
        referralCodeId: referralCode.id,
        invitedUserId: "user-2",
        status: "APPLIED" as const,
        code: referralCode.code,
        appliedAt: now,
        dismissedAt: null,
        invitedRewardGrantedAt: now,
        ownerRewardGrantedAt: null,
        ownerRewardSourcePaymentId: null,
        createdAt: now,
        updatedAt: now,
      }),
    );

    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        findUseByInvitedUserId: mock(() => Promise.resolve(null)),
        findActiveCodeByCode: mock(() =>
          Promise.resolve({
            ...referralCode,
            userId: "owner-2",
          }),
        ),
        createAppliedUse: createAppliedUseMock,
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.applyCode("user-2", "abc12345");

    expect(result).toEqual({
      success: true,
      rewardAmountInCents: 100,
    });
    expect(createAppliedUseMock).toHaveBeenCalledTimes(1);
  });
});

describe("ReferralService.createWithdrawal", () => {
  it("impede saque quando o saldo disponível é menor que o solicitado", async () => {
    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        countGrantedOwnerRewards: mock(() => Promise.resolve(0)),
        countGrantedInvitedRewards: mock(() => Promise.resolve(0)),
        sumReservedWithdrawals: mock(() => Promise.resolve(0)),
        createWithdrawal: mock(),
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {
        $transaction: mock(async (callback: (tx: object) => Promise<unknown>) =>
          callback({}),
        ),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();

    await expectElysiaError(
      RS.createWithdrawal("user-1", 10_000, "user@test.com"),
      Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.message,
      Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.httpStatus,
    );
  });

  it("rejeita chave pix fora dos tipos aceitos", async () => {
    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        countGrantedOwnerRewards: mock(() => Promise.resolve(100)),
        countGrantedInvitedRewards: mock(() => Promise.resolve(0)),
        sumReservedWithdrawals: mock(() => Promise.resolve(0)),
        createWithdrawal: mock(),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();

    await expectElysiaError(
      RS.createWithdrawal("user-1", 10_000, "12345678000199"),
      Errors.REFERRAL.WITHDRAWAL_INVALID_PIX_KEY.message,
      Errors.REFERRAL.WITHDRAWAL_INVALID_PIX_KEY.httpStatus,
    );
  });

  it("cria a solicitação quando saldo, valor e chave pix são válidos", async () => {
    const createWithdrawalMock = mock(() =>
      Promise.resolve({
        id: "withdrawal-1",
        userId: "user-1",
        amountInCents: 10_000,
        pixKey: "+5511999998888",
        pixKeyType: "PHONE" as const,
        status: "PENDING" as const,
        createdAt: now,
        updatedAt: now,
        paidAt: null,
        rejectedAt: null,
        cancelledAt: null,
      }),
    );

    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        countGrantedOwnerRewards: mock(() => Promise.resolve(100)),
        countGrantedInvitedRewards: mock(() => Promise.resolve(0)),
        sumReservedWithdrawals: mock(() => Promise.resolve(0)),
        createWithdrawal: createWithdrawalMock,
      },
    }));

    mock.module("../../../shared/lib/db", () => ({
      prisma: {
        $transaction: mock(async (callback: (tx: object) => Promise<unknown>) =>
          callback({}),
        ),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.createWithdrawal("user-1", 10_000, "(11) 99999-8888");

    expect(result).toEqual({
      id: "withdrawal-1",
      amountInCents: 10_000,
      pixKeyType: "PHONE",
      status: "PENDING",
    });
    expect(createWithdrawalMock).toHaveBeenCalledTimes(1);
    expect(createWithdrawalMock).toHaveBeenCalledWith(
      {
        userId: "user-1",
        amountInCents: 10_000,
        pixKey: "+5511999998888",
        pixKeyType: "PHONE",
      },
      {},
    );
  });
});

describe("ReferralService.listAdminWithdrawals", () => {
  it("lista saques paginados com filtro de status", async () => {
    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        countAdminWithdrawals: mock(() => Promise.resolve(1)),
        listAdminWithdrawals: mock(() =>
          Promise.resolve([
            {
              id: "withdrawal-1",
              userId: "user-1",
              amountInCents: 15_000,
              pixKey: "user@test.com",
              pixKeyType: "EMAIL" as const,
              status: "PENDING" as const,
              createdAt: now,
              updatedAt: now,
              paidAt: null,
              rejectedAt: null,
              cancelledAt: null,
              user: {
                id: "user-1",
                name: "Cliente Admin",
                email: "user@test.com",
              },
            },
          ]),
        ),
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.listAdminWithdrawals({
      page: "2",
      pageSize: "20",
      status: "PENDING",
    });

    expect(result).toEqual({
      items: [
        {
          id: "withdrawal-1",
          amountInCents: 15_000,
          pixKey: "user@test.com",
          pixKeyType: "EMAIL",
          status: "PENDING",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          paidAt: null,
          rejectedAt: null,
          cancelledAt: null,
          user: {
            id: "user-1",
            name: "Cliente Admin",
            email: "user@test.com",
          },
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      status: "PENDING",
    });
  });
});

describe("ReferralService.updateAdminWithdrawalStatus", () => {
  it("atualiza o status para pago e registra paidAt", async () => {
    const updateWithdrawalStatusMock = mock(() =>
      Promise.resolve({
        id: "withdrawal-1",
        userId: "user-1",
        amountInCents: 10_000,
        pixKey: "user@test.com",
        pixKeyType: "EMAIL" as const,
        status: "PAID" as const,
        createdAt: now,
        updatedAt: now,
        paidAt: now,
        rejectedAt: null,
        cancelledAt: null,
        user: {
          id: "user-1",
          name: "Cliente Admin",
          email: "user@test.com",
        },
      }),
    );

    mock.module("../referral.repository", () => ({
      ReferralRepository: {
        updateWithdrawalStatus: updateWithdrawalStatusMock,
      },
    }));

    const { ReferralService: RS } = await loadReferralService();
    const result = await RS.updateAdminWithdrawalStatus("withdrawal-1", "PAID");

    expect(updateWithdrawalStatusMock).toHaveBeenCalledTimes(1);
    expect(updateWithdrawalStatusMock).toHaveBeenCalledWith({
      id: "withdrawal-1",
      status: "PAID",
      paidAt: expect.any(Date),
      rejectedAt: null,
      cancelledAt: null,
    });
    expect(result).toEqual({
      id: "withdrawal-1",
      amountInCents: 10_000,
      pixKey: "user@test.com",
      pixKeyType: "EMAIL",
      status: "PAID",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      paidAt: now.toISOString(),
      rejectedAt: null,
      cancelledAt: null,
      user: {
        id: "user-1",
        name: "Cliente Admin",
        email: "user@test.com",
      },
    });
  });
});

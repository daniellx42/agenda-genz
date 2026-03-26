import type {
  Prisma,
  ReferralPixKeyType,
  ReferralUseStatus,
  ReferralWithdrawalStatus,
} from "@agenda-genz/db";
import { prisma } from "../../shared/lib/db";

const referralCodeSelect = {
  id: true,
  userId: true,
  code: true,
  createdAt: true,
  updatedAt: true,
} as const;

const referralUseSelect = {
  id: true,
  referralCodeId: true,
  invitedUserId: true,
  status: true,
  code: true,
  appliedAt: true,
  dismissedAt: true,
  invitedRewardGrantedAt: true,
  ownerRewardGrantedAt: true,
  ownerRewardSourcePaymentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const referralWithdrawalSelect = {
  id: true,
  userId: true,
  amountInCents: true,
  pixKey: true,
  pixKeyType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  rejectedAt: true,
  cancelledAt: true,
} as const;

type ReferralDatabaseClient = Prisma.TransactionClient | typeof prisma;

export type ReferralCodeRecord = {
  id: string;
  userId: string | null;
  code: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ReferralUseRecord = {
  id: string;
  referralCodeId: string | null;
  invitedUserId: string | null;
  status: ReferralUseStatus;
  code: string | null;
  appliedAt: Date | null;
  dismissedAt: Date | null;
  invitedRewardGrantedAt: Date | null;
  ownerRewardGrantedAt: Date | null;
  ownerRewardSourcePaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReferralWithdrawalRecord = {
  id: string;
  userId: string | null;
  amountInCents: number;
  pixKey: string;
  pixKeyType: ReferralPixKeyType;
  status: ReferralWithdrawalStatus;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
};

export abstract class ReferralRepository {
  static async findCodeByUserId(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralCodeRecord | null> {
    return db.referralCode.findFirst({
      where: { userId },
      select: referralCodeSelect,
    });
  }

  static async findActiveCodeByCode(
    code: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralCodeRecord | null> {
    return db.referralCode.findFirst({
      where: {
        code,
        userId: {
          not: null,
        },
      },
      select: referralCodeSelect,
    });
  }

  static async createCode(
    data: {
      userId: string;
      code: string;
    },
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralCodeRecord> {
    return db.referralCode.create({
      data,
      select: referralCodeSelect,
    });
  }

  static async findUseByInvitedUserId(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralUseRecord | null> {
    return db.referralUse.findFirst({
      where: {
        invitedUserId: userId,
      },
      select: referralUseSelect,
    });
  }

  static async createAppliedUse(
    data: {
      referralCodeId: string;
      invitedUserId: string;
      code: string;
      appliedAt: Date;
      invitedRewardGrantedAt: Date;
    },
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralUseRecord> {
    return db.referralUse.create({
      data: {
        ...data,
        status: "APPLIED",
      },
      select: referralUseSelect,
    });
  }

  static async upsertDismissedUse(
    invitedUserId: string,
    dismissedAt: Date,
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralUseRecord> {
    return db.referralUse.upsert({
      where: { invitedUserId },
      update: {},
      create: {
        invitedUserId,
        status: "DISMISSED",
        dismissedAt,
      },
      select: referralUseSelect,
    });
  }

  static async countReferralUsersByOwner(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<number> {
    return db.referralUse.count({
      where: {
        status: "APPLIED",
        referralCode: {
          userId,
        },
      },
    });
  }

  static async countGrantedOwnerRewards(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<number> {
    return db.referralUse.count({
      where: {
        ownerRewardGrantedAt: {
          not: null,
        },
        referralCode: {
          userId,
        },
      },
    });
  }

  static async countGrantedInvitedRewards(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<number> {
    return db.referralUse.count({
      where: {
        invitedUserId: userId,
        invitedRewardGrantedAt: {
          not: null,
        },
      },
    });
  }

  static async sumReservedWithdrawals(
    userId: string,
    db: ReferralDatabaseClient = prisma,
  ): Promise<number> {
    const result = await db.referralWithdrawal.aggregate({
      where: {
        userId,
        status: {
          in: ["PENDING", "PAID"],
        },
      },
      _sum: {
        amountInCents: true,
      },
    });

    return result._sum.amountInCents ?? 0;
  }

  static async createWithdrawal(
    data: {
      userId: string;
      amountInCents: number;
      pixKey: string;
      pixKeyType: ReferralPixKeyType;
    },
    db: ReferralDatabaseClient = prisma,
  ): Promise<ReferralWithdrawalRecord> {
    return db.referralWithdrawal.create({
      data,
      select: referralWithdrawalSelect,
    });
  }

  static async grantOwnerRewardForApprovedPayment(
    invitedUserId: string,
    paymentId: string,
    rewardedAt: Date,
    db: ReferralDatabaseClient = prisma,
  ): Promise<number> {
    const result = await db.referralUse.updateMany({
      where: {
        invitedUserId,
        status: "APPLIED",
        ownerRewardGrantedAt: null,
      },
      data: {
        ownerRewardGrantedAt: rewardedAt,
        ownerRewardSourcePaymentId: paymentId,
      },
    });

    return result.count;
  }
}

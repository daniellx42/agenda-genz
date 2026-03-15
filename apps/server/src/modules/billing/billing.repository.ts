import type {
  BillingPaymentStatus,
  BillingPlanInterval,
} from "@agenda-genz/db";
import { prisma } from "../../shared/lib/db";
import type { BillingModel } from "./billing.model";

const planSelect = {
  id: true,
  interval: true,
  name: true,
  priceInCents: true,
  durationDays: true,
  discountLabel: true,
} as const;

const paymentSelect = {
  id: true,
  userId: true,
  planId: true,
  mpPaymentId: true,
  mpIdempotencyKey: true,
  amount: true,
  durationDays: true,
  status: true,
  pixQrCode: true,
  pixQrCodeBase64: true,
  pixExpiresAt: true,
  paidAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  plan: { select: { name: true } },
} as const;

const activePlanSelect = {
  ...planSelect,
  active: true,
} as const;

type BillingPlanRecord = {
  id: string;
  interval: BillingPlanInterval;
  name: string;
  priceInCents: number;
  durationDays: number;
  discountLabel: string | null;
};

type BillingPlanWithActiveRecord = BillingPlanRecord & {
  active: boolean;
};

type BillingPaymentRecord = {
  id: string;
  userId: string | null;
  planId: string;
  mpPaymentId: string | null;
  mpIdempotencyKey: string;
  amount: number;
  durationDays: number;
  status: BillingPaymentStatus;
  pixQrCode: string | null;
  pixQrCodeBase64: string | null;
  pixExpiresAt: Date | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan: {
    name: string;
  };
};

type BillingPaymentWithPlanDetailsRecord = Omit<BillingPaymentRecord, "plan"> & {
  plan: {
    name: string;
    durationDays: number;
  };
};

type BillingUserRecord = {
  id: string;
  email: string;
  planExpiresAt: Date | null;
};

export abstract class BillingRepository {
  static async listActivePlans(): Promise<BillingModel.planResponse[]> {
    const plans = await prisma.billingPlan.findMany({
      where: { active: true },
      select: planSelect,
      orderBy: { durationDays: "asc" },
    });
    return plans;
  }

  static async findPlanById(
    id: string,
  ): Promise<BillingPlanWithActiveRecord | null> {
    return prisma.billingPlan.findFirst({
      where: { id, active: true },
      select: activePlanSelect,
    });
  }

  static async createPayment(data: {
    userId: string;
    planId: string;
    mpPaymentId: string | null;
    mpIdempotencyKey: string;
    amount: number;
    durationDays: number;
    pixQrCode: string | null;
    pixQrCodeBase64: string | null;
    pixExpiresAt: Date;
  }): Promise<BillingPaymentRecord> {
    return prisma.billingPayment.create({
      data,
      select: paymentSelect,
    });
  }

  static async findPaymentById(
    id: string,
    userId: string,
  ): Promise<BillingPaymentRecord | null> {
    return prisma.billingPayment.findFirst({
      where: { id, userId },
      select: paymentSelect,
    });
  }

  static async findPaymentByMpId(
    mpPaymentId: string,
  ): Promise<BillingPaymentWithPlanDetailsRecord | null> {
    return prisma.billingPayment.findFirst({
      where: { mpPaymentId },
      select: {
        ...paymentSelect,
        plan: { select: { name: true, durationDays: true } },
      },
    });
  }

  static async cancelPendingPayments(userId: string): Promise<void> {
    await prisma.billingPayment.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  static async updatePaymentStatus(
    id: string,
    data: {
      status: BillingPaymentStatus;
      paidAt?: Date;
      expiresAt?: Date;
      mpPaymentId?: string;
    },
  ): Promise<BillingPaymentRecord> {
    return prisma.billingPayment.update({
      where: { id },
      data,
      select: paymentSelect,
    });
  }

  static async updateUserPlanExpiry(
    userId: string,
    planExpiresAt: Date,
  ): Promise<{ id: string; planExpiresAt: Date | null }> {
    return prisma.user.update({
      where: { id: userId },
      data: { planExpiresAt },
      select: { id: true, planExpiresAt: true },
    });
  }

  static async findUserById(userId: string): Promise<BillingUserRecord | null> {
    return prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, email: true, planExpiresAt: true },
    });
  }
}

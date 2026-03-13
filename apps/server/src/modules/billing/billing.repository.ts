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

export abstract class BillingRepository {
  static async listActivePlans(): Promise<BillingModel.planResponse[]> {
    const plans = await prisma.billingPlan.findMany({
      where: { active: true },
      select: planSelect,
      orderBy: { durationDays: "asc" },
    });
    return plans;
  }

  static async findPlanById(id: string) {
    return prisma.billingPlan.findFirst({
      where: { id, active: true },
      select: { ...planSelect, active: true },
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
  }) {
    return prisma.billingPayment.create({
      data,
      select: paymentSelect,
    });
  }

  static async findPaymentById(id: string, userId: string) {
    return prisma.billingPayment.findFirst({
      where: { id, userId },
      select: paymentSelect,
    });
  }

  static async findPaymentByMpId(mpPaymentId: string) {
    return prisma.billingPayment.findFirst({
      where: { mpPaymentId },
      select: {
        ...paymentSelect,
        plan: { select: { name: true, durationDays: true } },
      },
    });
  }

  static async cancelPendingPayments(userId: string) {
    await prisma.billingPayment.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  static async updatePaymentStatus(
    id: string,
    data: {
      status: "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
      paidAt?: Date;
      expiresAt?: Date;
      mpPaymentId?: string;
    },
  ) {
    return prisma.billingPayment.update({
      where: { id },
      data,
      select: paymentSelect,
    });
  }

  static async updateUserPlanExpiry(userId: string, planExpiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { planExpiresAt },
    });
  }

  static async findUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, email: true, planExpiresAt: true },
    });
  }
}

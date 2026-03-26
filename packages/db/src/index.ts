import { env } from "@agenda-genz/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { Prisma } from "../prisma/generated/client";
export type {
  Appointment,
  BillingPayment,
  BillingPlan,
  ReferralCode,
  ReferralUse,
  ReferralWithdrawal,
  User,
} from "../prisma/generated/client";
export {
  AppointmentStatus,
  BillingPaymentStatus,
  BillingPlanInterval,
  PaymentStatus,
  ReferralPixKeyType,
  ReferralUseStatus,
  ReferralWithdrawalStatus,
} from "../prisma/generated/enums";
export default prisma;

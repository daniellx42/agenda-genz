import { env } from "@agenda-genz/env/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "./generated/client";

config({ path: "../../apps/server/.env" });

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    interval: "MONTHLY" as const,
    name: "Mensal",
    priceInCents: 999,
    durationDays: 30,
    discountLabel: null,
  },
  {
    interval: "QUARTERLY" as const,
    name: "Trimestral",
    priceInCents: 2890,
    durationDays: 90,
    discountLabel: "5% off",
  },
  {
    interval: "SEMIANNUAL" as const,
    name: "Semestral",
    priceInCents: 5390,
    durationDays: 180,
    discountLabel: "10% off",
  },
  {
    interval: "ANNUAL" as const,
    name: "Anual",
    priceInCents: 9590,
    durationDays: 365,
    discountLabel: "20% off",
  },
];

async function seedPlans() {
  console.log("Seeding billing plans...");

  for (const plan of plans) {
    await prisma.billingPlan.upsert({
      where: { interval: plan.interval },
      update: {
        name: plan.name,
        priceInCents: plan.priceInCents,
        durationDays: plan.durationDays,
        discountLabel: plan.discountLabel,
        active: true,
      },
      create: plan,
    });

    console.log(`  ✓ ${plan.name} — R$ ${(plan.priceInCents / 100).toFixed(2)}`);
  }

  console.log("Done!");
}

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

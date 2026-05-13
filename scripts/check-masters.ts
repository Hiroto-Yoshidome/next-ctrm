import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const [cps, pis] = await Promise.all([
    prisma.counterparty.findMany({ select: { name: true } }),
    prisma.pricingIndex.findMany({ select: { code: true } }),
  ]);
  console.log("取引先:", cps.map((c) => c.name));
  console.log("評価指標:", pis.map((p) => p.code));
  await prisma.$disconnect();
}
main().catch(console.error);

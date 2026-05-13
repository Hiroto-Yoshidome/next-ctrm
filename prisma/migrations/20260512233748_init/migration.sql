-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('THREE_WAY', 'EXPORT', 'IMPORT', 'DOMESTIC', 'DIRECT');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'UNFIXED');

-- CreateEnum
CREATE TYPE "PriceFixType" AS ENUM ('SPOT', 'MONTHLY_AVG');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'JPY');

-- CreateEnum
CREATE TYPE "Commodity" AS ENUM ('COPPER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PriceFixStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "RealizeType" AS ENUM ('PROVISIONAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RealizeStatus" AS ENUM ('DRAFT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "FxStatus" AS ENUM ('OPEN', 'SETTLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmePrice" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "priceUsd" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "usdJpy" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tradeType" "TradeType" NOT NULL,
    "side" "TradeSide" NOT NULL,
    "tradeDate" TIMESTAMP(3) NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "commodity" "Commodity" NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "priceType" "PricingType" NOT NULL,
    "unitPrice" DECIMAL(12,4),
    "premium" DECIMAL(12,4),
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceFix" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "fixDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "fixType" "PriceFixType" NOT NULL,
    "pricingDate" TIMESTAMP(3),
    "spotPrice" DECIMAL(12,4),
    "pricingMonth" TEXT,
    "monthlyAvg" DECIMAL(12,4),
    "premium" DECIMAL(12,4),
    "unitPrice" DECIMAL(12,4),
    "status" "PriceFixStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceFix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Realize" (
    "id" TEXT NOT NULL,
    "sellContractId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "realizeDate" TIMESTAMP(3) NOT NULL,
    "realizeType" "RealizeType" NOT NULL,
    "unitPrice" DECIMAL(12,4),
    "currency" "Currency" NOT NULL,
    "status" "RealizeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Realize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealizeAllocation" (
    "id" TEXT NOT NULL,
    "realizeId" TEXT NOT NULL,
    "buyContractId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "RealizeAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "commodity" "Commodity" NOT NULL,
    "deliveryMonth" TEXT NOT NULL,
    "buyQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "sellQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "netQty" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxTransaction" (
    "id" TEXT NOT NULL,
    "realizeId" TEXT NOT NULL,
    "amountUsd" DECIMAL(14,4) NOT NULL,
    "status" "FxStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LmePrice_date_key" ON "LmePrice"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_date_key" ON "ExchangeRate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Position_commodity_deliveryMonth_key" ON "Position"("commodity", "deliveryMonth");

-- CreateIndex
CREATE UNIQUE INDEX "FxTransaction_realizeId_key" ON "FxTransaction"("realizeId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceFix" ADD CONSTRAINT "PriceFix_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Realize" ADD CONSTRAINT "Realize_sellContractId_fkey" FOREIGN KEY ("sellContractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealizeAllocation" ADD CONSTRAINT "RealizeAllocation_realizeId_fkey" FOREIGN KEY ("realizeId") REFERENCES "Realize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealizeAllocation" ADD CONSTRAINT "RealizeAllocation_buyContractId_fkey" FOREIGN KEY ("buyContractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FxTransaction" ADD CONSTRAINT "FxTransaction_realizeId_fkey" FOREIGN KEY ("realizeId") REFERENCES "Realize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

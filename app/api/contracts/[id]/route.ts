import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import {
  TradeForm, DeliveryType, TradeSide, PricingType, Currency,
} from "@/app/generated/prisma/enums";

const VALID_TRADE_FORMS = new Set<string>(["OVERSEAS", "IMPORT", "EXPORT", "DOMESTIC"]);
const VALID_DELIVERY_TYPES = new Set<string>(["DIRECT", "STOCK"]);
const VALID_SIDES = new Set<string>(["BUY", "SELL"]);
const VALID_PRICE_TYPES = new Set<string>(["FIXED", "UNFIXED"]);
const VALID_CURRENCIES = new Set<string>(["USD", "JPY"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      counterparty: true,
      basePricingIndex: true,
      premiumPricingIndex: true,
      expenses: { orderBy: { createdAt: "asc" } },
      priceFixes: { orderBy: { fixDate: "asc" } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    contractRef, tradeForm, deliveryType, side, tradeDate,
    counterpartyCode, quantity, currency, incoterms,
    priceType, basePricingIndexCode, premiumPricingIndexCode,
    unitPrice, premium, qpStartDate, qpEndDate, memo,
  } = body;

  if (!contractRef?.trim()) return NextResponse.json({ error: "成約Indexは必須です" }, { status: 400 });
  if (!VALID_TRADE_FORMS.has(tradeForm)) return NextResponse.json({ error: "取引形態が無効です" }, { status: 400 });
  if (!VALID_DELIVERY_TYPES.has(deliveryType)) return NextResponse.json({ error: "直送/在庫区分が無効です" }, { status: 400 });
  if (!VALID_SIDES.has(side)) return NextResponse.json({ error: "売買区分が無効です" }, { status: 400 });
  if (!tradeDate) return NextResponse.json({ error: "成約日は必須です" }, { status: 400 });
  if (!counterpartyCode?.trim()) return NextResponse.json({ error: "取引先コードは必須です" }, { status: 400 });
  if (!quantity || Number(quantity) <= 0) return NextResponse.json({ error: "数量は正の数値で入力してください" }, { status: 400 });
  if (!VALID_CURRENCIES.has(currency)) return NextResponse.json({ error: "通貨が無効です" }, { status: 400 });
  if (!VALID_PRICE_TYPES.has(priceType)) return NextResponse.json({ error: "価格タイプが無効です" }, { status: 400 });
  if (!basePricingIndexCode?.trim()) return NextResponse.json({ error: "ベース評価指標は必須です" }, { status: 400 });
  if (unitPrice === undefined || unitPrice === null || unitPrice === "") return NextResponse.json({ error: "単価は必須です" }, { status: 400 });
  if (priceType === "UNFIXED" && (!qpStartDate || !qpEndDate)) {
    return NextResponse.json({ error: "UNFIXED成約はQP開始日・終了日が必須です" }, { status: 400 });
  }

  const [counterparty, basePricingIndex] = await Promise.all([
    prisma.counterparty.findUnique({ where: { code: counterpartyCode.trim() } }),
    prisma.pricingIndex.findUnique({ where: { code: basePricingIndexCode.trim() } }),
  ]);
  if (!counterparty) return NextResponse.json({ error: `取引先コード「${counterpartyCode}」が存在しません` }, { status: 400 });
  if (!basePricingIndex) return NextResponse.json({ error: `ベース評価指標「${basePricingIndexCode}」が存在しません` }, { status: 400 });

  let premiumPricingIndexId: string | null = null;
  if (premiumPricingIndexCode?.trim()) {
    const ppi = await prisma.pricingIndex.findUnique({ where: { code: premiumPricingIndexCode.trim() } });
    if (!ppi) return NextResponse.json({ error: `プレミアム評価指標「${premiumPricingIndexCode}」が存在しません` }, { status: 400 });
    premiumPricingIndexId = ppi.id;
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      contractRef: contractRef.trim(),
      tradeForm: tradeForm as TradeForm,
      deliveryType: deliveryType as DeliveryType,
      side: side as TradeSide,
      tradeDate: new Date(tradeDate),
      counterpartyId: counterparty.id,
      quantity: Number(quantity),
      currency: currency as Currency,
      incoterms: incoterms?.trim() || null,
      priceType: priceType as PricingType,
      basePricingIndexId: basePricingIndex.id,
      premiumPricingIndexId,
      unitPrice: Number(unitPrice),
      premium: premium !== "" && premium !== null && premium !== undefined ? Number(premium) : null,
      qpStartDate: qpStartDate ? new Date(qpStartDate) : null,
      qpEndDate: qpEndDate ? new Date(qpEndDate) : null,
      memo: memo?.trim() || null,
    },
  });

  return NextResponse.json(updated);
}

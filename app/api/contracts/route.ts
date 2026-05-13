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
const VALID_STATUSES = new Set<string>(["DRAFT", "CONFIRMED", "CLOSED"]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams: p } = new URL(req.url);
  const where: Record<string, unknown> = {};

  if (p.get("contractRef")) where.contractRef = { contains: p.get("contractRef"), mode: "insensitive" };
  const side = p.get("side");
  if (side) {
    if (!VALID_SIDES.has(side)) return NextResponse.json({ error: "売買区分が無効です" }, { status: 400 });
    where.side = side;
  }
  const tradeForm = p.get("tradeForm");
  if (tradeForm) {
    if (!VALID_TRADE_FORMS.has(tradeForm)) return NextResponse.json({ error: "取引形態が無効です" }, { status: 400 });
    where.tradeForm = tradeForm;
  }
  const status = p.get("status");
  if (status) {
    if (!VALID_STATUSES.has(status)) return NextResponse.json({ error: "ステータスが無効です" }, { status: 400 });
    where.status = status;
  }
  if (p.get("counterpartyId")) where.counterpartyId = p.get("counterpartyId");
  if (p.get("basePricingIndexId")) where.basePricingIndexId = p.get("basePricingIndexId");
  const dateFrom = p.get("dateFrom");
  const dateTo = p.get("dateTo");
  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (from && isNaN(from.getTime())) return NextResponse.json({ error: "dateFromの日付形式が無効です" }, { status: 400 });
    if (to && isNaN(to.getTime())) return NextResponse.json({ error: "dateToの日付形式が無効です" }, { status: 400 });
    where.tradeDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  const data = await prisma.contract.findMany({
    where,
    include: {
      counterparty: { select: { name: true } },
      basePricingIndex: { select: { code: true, name: true } },
      premiumPricingIndex: { select: { code: true, name: true } },
    },
    orderBy: { tradeDate: "desc" },
  });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const contract = await prisma.contract.create({
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

  return NextResponse.json(contract, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams: p } = new URL(req.url);
  const where: Record<string, unknown> = {};

  const VALID_SIDES = new Set(["BUY", "SELL"]);
  const VALID_FORMS = new Set(["OVERSEAS", "IMPORT", "EXPORT", "DOMESTIC"]);
  const VALID_STATUSES = new Set(["DRAFT", "CONFIRMED", "CLOSED"]);

  if (p.get("contractRef")) where.contractRef = { contains: p.get("contractRef"), mode: "insensitive" };
  const side = p.get("side");
  if (side) {
    if (!VALID_SIDES.has(side)) return NextResponse.json({ error: "売買区分が無効です" }, { status: 400 });
    where.side = side;
  }
  const tradeForm = p.get("tradeForm");
  if (tradeForm) {
    if (!VALID_FORMS.has(tradeForm)) return NextResponse.json({ error: "取引形態が無効です" }, { status: 400 });
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

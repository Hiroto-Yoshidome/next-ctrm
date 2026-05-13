import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import ExcelJS from "exceljs";
import {
  TradeForm,
  DeliveryType,
  TradeSide,
  PricingType,
  Currency,
} from "@/app/generated/prisma/enums";

interface ContractRow {
  contractRef: string;
  tradeForm: TradeForm;
  deliveryType: DeliveryType;
  side: TradeSide;
  tradeDate: Date;
  counterpartyName: string;
  quantity: number;
  currency: Currency;
  incoterms?: string;
  priceType: PricingType;
  basePricingIndexCode: string;
  premiumPricingIndexCode?: string;
  unitPrice: number;
  premium?: number;
  qpStartDate?: Date;
  qpEndDate?: Date;
  memo?: string;
}

interface ExpenseRow {
  contractRef: string;
  expenseType: string;
  quantityUnit: string;
  unitPrice: number;
  currency: Currency;
}

interface ValidationError {
  sheet: string;
  row: number;
  message: string;
}

const TRADE_FORMS: Record<string, TradeForm> = {
  OVERSEAS: "OVERSEAS",
  IMPORT: "IMPORT",
  EXPORT: "EXPORT",
  DOMESTIC: "DOMESTIC",
};
const DELIVERY_TYPES: Record<string, DeliveryType> = { DIRECT: "DIRECT", STOCK: "STOCK" };
const TRADE_SIDES: Record<string, TradeSide> = { BUY: "BUY", SELL: "SELL" };
const PRICING_TYPES: Record<string, PricingType> = { FIXED: "FIXED", UNFIXED: "UNFIXED" };
const CURRENCIES: Record<string, Currency> = { USD: "USD", JPY: "JPY" };

function cellStr(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cellNum(value: ExcelJS.CellValue): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function cellDate(value: ExcelJS.CellValue): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは10MB以下にしてください" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(Buffer.from(bytes) as any);
  } catch {
    return NextResponse.json({ error: "Excelファイルの読み込みに失敗しました。形式を確認してください" }, { status: 400 });
  }

  const sheet1 = workbook.getWorksheet(1);
  const sheet2 = workbook.getWorksheet(2);
  if (!sheet1) return NextResponse.json({ error: "Sheet1（成約データ）が見つかりません" }, { status: 400 });

  // マスタを事前取得
  const [counterparties, pricingIndices] = await Promise.all([
    prisma.counterparty.findMany({ select: { id: true, name: true } }),
    prisma.pricingIndex.findMany({ select: { id: true, code: true } }),
  ]);
  const cpMap = new Map(counterparties.map((c) => [c.name, c.id]));
  const piMap = new Map(pricingIndices.map((p) => [p.code, p.id]));

  const errors: ValidationError[] = [];
  const contractRows: ContractRow[] = [];
  const expenseRows: ExpenseRow[] = [];

  // --- Sheet1 パース ---
  sheet1.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // ヘッダ行スキップ
    const vals = row.values as ExcelJS.CellValue[];
    // ExcelJSはvals[0]が空なのでvals[1]から始まる
    const [, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q] = vals;

    const contractRef = cellStr(A);
    if (!contractRef) { errors.push({ sheet: "成約", row: rowNum, message: "成約Indexは必須です" }); return; }

    const tradeForm = TRADE_FORMS[cellStr(B)];
    if (!tradeForm) { errors.push({ sheet: "成約", row: rowNum, message: `取引形態「${cellStr(B)}」は無効です（OVERSEAS/IMPORT/EXPORT/DOMESTIC）` }); return; }

    const deliveryType = DELIVERY_TYPES[cellStr(C)];
    if (!deliveryType) { errors.push({ sheet: "成約", row: rowNum, message: `直送/在庫区分「${cellStr(C)}」は無効です（DIRECT/STOCK）` }); return; }

    const side = TRADE_SIDES[cellStr(D)];
    if (!side) { errors.push({ sheet: "成約", row: rowNum, message: `売買区分「${cellStr(D)}」は無効です（BUY/SELL）` }); return; }

    const tradeDate = cellDate(E);
    if (!tradeDate) { errors.push({ sheet: "成約", row: rowNum, message: "成約日が無効です" }); return; }

    const counterpartyName = cellStr(F);
    if (!cpMap.has(counterpartyName)) {
      errors.push({ sheet: "成約", row: rowNum, message: `取引先「${counterpartyName}」はマスタに存在しません` });
      return;
    }

    const quantity = cellNum(G);
    if (quantity === undefined || quantity <= 0) { errors.push({ sheet: "成約", row: rowNum, message: "数量は正の数値で入力してください" }); return; }

    const currency = CURRENCIES[cellStr(H)];
    if (!currency) { errors.push({ sheet: "成約", row: rowNum, message: `通貨「${cellStr(H)}」は無効です（USD/JPY）` }); return; }

    const incoterms = cellStr(I) || undefined;

    const priceType = PRICING_TYPES[cellStr(J)];
    if (!priceType) { errors.push({ sheet: "成約", row: rowNum, message: `価格タイプ「${cellStr(J)}」は無効です（FIXED/UNFIXED）` }); return; }

    const basePricingIndexCode = cellStr(K);
    if (!piMap.has(basePricingIndexCode)) {
      errors.push({ sheet: "成約", row: rowNum, message: `ベース評価指標「${basePricingIndexCode}」はマスタに存在しません` });
      return;
    }

    const premiumPricingIndexCodeRaw = cellStr(L);
    const premiumPricingIndexCode = premiumPricingIndexCodeRaw || undefined;
    if (premiumPricingIndexCode && !piMap.has(premiumPricingIndexCode)) {
      errors.push({ sheet: "成約", row: rowNum, message: `プレミアム評価指標「${premiumPricingIndexCode}」はマスタに存在しません` });
      return;
    }

    const unitPrice = cellNum(M);
    if (unitPrice === undefined) { errors.push({ sheet: "成約", row: rowNum, message: "単価は必須です" }); return; }

    const premium = cellNum(N);
    const qpStartDate = cellDate(O);
    const qpEndDate = cellDate(P);

    if (priceType === "UNFIXED" && (!qpStartDate || !qpEndDate)) {
      errors.push({ sheet: "成約", row: rowNum, message: "UNFIXED成約はQP開始日・終了日が必須です" });
      return;
    }

    contractRows.push({
      contractRef,
      tradeForm,
      deliveryType,
      side,
      tradeDate,
      counterpartyName,
      quantity,
      currency,
      incoterms,
      priceType,
      basePricingIndexCode,
      premiumPricingIndexCode,
      unitPrice,
      premium,
      qpStartDate,
      qpEndDate,
      memo: cellStr(Q) || undefined,
    });
  });

  // --- Sheet2 パース ---
  if (sheet2) {
    sheet2.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const vals = row.values as ExcelJS.CellValue[];
      const [, A, B, C, D, E] = vals;

      const contractRef = cellStr(A);
      if (!contractRef) return;

      const expenseType = cellStr(B);
      if (!expenseType) { errors.push({ sheet: "諸掛", row: rowNum, message: "費目は必須です" }); return; }

      const quantityUnit = cellStr(C);
      if (!quantityUnit) { errors.push({ sheet: "諸掛", row: rowNum, message: "数量単位は必須です" }); return; }

      const unitPrice = cellNum(D);
      if (unitPrice === undefined) { errors.push({ sheet: "諸掛", row: rowNum, message: "単価は必須です" }); return; }

      const currency = CURRENCIES[cellStr(E)];
      if (!currency) { errors.push({ sheet: "諸掛", row: rowNum, message: `通貨「${cellStr(E)}」は無効です` }); return; }

      expenseRows.push({ contractRef, expenseType, quantityUnit, unitPrice, currency });
    });
  }

  // 諸掛の成約Indexが成約データに存在するか確認
  const contractRefSet = new Set(contractRows.map((r) => r.contractRef));
  expenseRows.forEach((e, i) => {
    if (!contractRefSet.has(e.contractRef)) {
      errors.push({ sheet: "諸掛", row: i + 2, message: `成約Index「${e.contractRef}」が成約データに存在しません` });
    }
  });

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // --- DB登録（トランザクション） ---
  await prisma.$transaction(async (tx) => {
    for (const row of contractRows) {
      const contract = await tx.contract.create({
        data: {
          contractRef: row.contractRef,
          tradeForm: row.tradeForm,
          deliveryType: row.deliveryType,
          side: row.side,
          tradeDate: row.tradeDate,
          counterpartyId: cpMap.get(row.counterpartyName)!,
          quantity: row.quantity,
          currency: row.currency,
          incoterms: row.incoterms,
          priceType: row.priceType,
          basePricingIndexId: piMap.get(row.basePricingIndexCode)!,
          premiumPricingIndexId: row.premiumPricingIndexCode
            ? piMap.get(row.premiumPricingIndexCode)
            : null,
          unitPrice: row.unitPrice,
          premium: row.premium ?? null,
          qpStartDate: row.qpStartDate ?? null,
          qpEndDate: row.qpEndDate ?? null,
          memo: row.memo ?? null,
        },
      });

      const expenses = expenseRows.filter((e) => e.contractRef === row.contractRef);
      for (const exp of expenses) {
        await tx.contractExpense.create({
          data: {
            contractId: contract.id,
            expenseType: exp.expenseType,
            quantityUnit: exp.quantityUnit,
            unitPrice: exp.unitPrice,
            currency: exp.currency,
          },
        });
      }
    }
  });

  return NextResponse.json({ imported: contractRows.length, expenses: expenseRows.length });
}

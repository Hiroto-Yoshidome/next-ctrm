"use client";

import { useState, useEffect } from "react";
import { useTab } from "@/app/contexts/TabContext";

interface Contract {
  id: string;
  contractRef: string;
  tradeForm: string;
  deliveryType: string;
  side: string;
  tradeDate: string;
  counterparty: { name: string };
  quantity: string;
  currency: string;
  incoterms: string | null;
  priceType: string;
  basePricingIndex: { code: string; name: string };
  premiumPricingIndex: { code: string; name: string } | null;
  unitPrice: string | null;
  premium: string | null;
  qpStartDate: string | null;
  qpEndDate: string | null;
  memo: string | null;
  status: string;
  expenses: Expense[];
  priceFixes: PriceFix[];
}

interface Expense {
  id: string;
  expenseType: string;
  quantityUnit: string;
  unitPrice: string;
  currency: string;
}

interface PriceFix {
  id: string;
  fixDate: string;
  quantity: string;
  fixType: string;
  unitPrice: string | null;
  premium: string | null;
  pricingMonth: string | null;
  pricingDate: string | null;
  status: string;
}

const FORM_LABELS: Record<string, string> = { OVERSEAS: "三国間(OVERSEAS)", IMPORT: "輸入(IMPORT)", EXPORT: "輸出(EXPORT)", DOMESTIC: "国内(DOMESTIC)" };
const DELIVERY_LABELS: Record<string, string> = { DIRECT: "直送", STOCK: "在庫" };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};
const STATUS_LABELS: Record<string, string> = { DRAFT: "下書", CONFIRMED: "承認済", CLOSED: "決済済" };

function fmt(v: string | null, d = 2) {
  if (!v) return "—";
  const n = parseFloat(v);
  return isNaN(n) ? "—" : n.toLocaleString("ja-JP", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("ja-JP");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-1.5 border-b border-gray-100 last:border-0">
      <dt className="w-40 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800">{value ?? "—"}</dd>
    </div>
  );
}

export default function ContractDetailTab({ contractId }: { contractId: string }) {
  const { openTab } = useTab();
  const [data, setData] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contracts/${contractId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) return <p className="text-sm text-gray-400">読み込み中...</p>;
  if (!data) return <p className="text-sm text-red-500">データが見つかりません</p>;

  return (
    <div className="max-w-3xl">
      {/* ヘッダ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{data.contractRef}</h2>
          <p className="text-sm text-gray-500 mt-0.5">成約内容確認</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded text-sm font-medium ${STATUS_COLORS[data.status]}`}>
            {STATUS_LABELS[data.status]}
          </span>
          <button
            onClick={() => openTab("contracts-list", "成約一覧")}
            className="px-4 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
          >
            ← 一覧に戻る
          </button>
        </div>
      </div>

      {/* 成約情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">成約情報</h3>
        <dl>
          <Row label="成約Index" value={data.contractRef} />
          <Row label="取引形態" value={FORM_LABELS[data.tradeForm] ?? data.tradeForm} />
          <Row label="直送/在庫区分" value={DELIVERY_LABELS[data.deliveryType] ?? data.deliveryType} />
          <Row label="売買区分" value={
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${data.side === "BUY" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
              {data.side === "BUY" ? "買" : "売"}
            </span>
          } />
          <Row label="成約日" value={fmtDate(data.tradeDate)} />
          <Row label="取引先" value={data.counterparty.name} />
          <Row label="数量" value={`${fmt(data.quantity, 3)} MT`} />
          <Row label="通貨" value={data.currency} />
          <Row label="インコタームズ" value={data.incoterms} />
          <Row label="価格タイプ" value={data.priceType} />
          <Row label="ベース評価指標" value={`${data.basePricingIndex.code}（${data.basePricingIndex.name}）`} />
          <Row label="プレミアム評価指標" value={data.premiumPricingIndex ? `${data.premiumPricingIndex.code}（${data.premiumPricingIndex.name}）` : null} />
          <Row label="単価" value={data.unitPrice ? `${fmt(data.unitPrice, 2)} ${data.currency}` : null} />
          <Row label="プレミアム" value={data.premium ? `${fmt(data.premium, 2)} ${data.currency}` : null} />
          <Row label="QP期間" value={data.qpStartDate ? `${fmtDate(data.qpStartDate)} 〜 ${fmtDate(data.qpEndDate)}` : null} />
          <Row label="備考" value={data.memo} />
        </dl>
      </div>

      {/* 予定諸掛 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">予定諸掛</h3>
        {data.expenses.length === 0 ? (
          <p className="text-sm text-gray-400">登録されていません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600">費目</th>
                <th className="text-left py-1.5 font-medium text-gray-600">数量単位</th>
                <th className="text-right py-1.5 font-medium text-gray-600">単価</th>
                <th className="text-left py-1.5 font-medium text-gray-600 pl-3">通貨</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-1.5 text-gray-800">{e.expenseType}</td>
                  <td className="py-1.5 text-gray-700">{e.quantityUnit}</td>
                  <td className="py-1.5 text-right text-gray-800">{fmt(e.unitPrice, 2)}</td>
                  <td className="py-1.5 pl-3 text-gray-700">{e.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 値決め情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">値決め情報</h3>
        {data.priceFixes.length === 0 ? (
          <p className="text-sm text-gray-400">値決めレコードがありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 font-medium text-gray-600">値決日</th>
                <th className="text-left py-1.5 font-medium text-gray-600">タイプ</th>
                <th className="text-right py-1.5 font-medium text-gray-600">数量</th>
                <th className="text-right py-1.5 font-medium text-gray-600">単価</th>
                <th className="text-left py-1.5 font-medium text-gray-600 pl-3">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.priceFixes.map((pf) => (
                <tr key={pf.id}>
                  <td className="py-1.5 text-gray-700">{fmtDate(pf.fixDate)}</td>
                  <td className="py-1.5 text-gray-700">{pf.fixType}</td>
                  <td className="py-1.5 text-right text-gray-800">{fmt(pf.quantity, 3)}</td>
                  <td className="py-1.5 text-right text-gray-800">{fmt(pf.unitPrice, 2)}</td>
                  <td className="py-1.5 pl-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[pf.status] ?? ""}`}>
                      {STATUS_LABELS[pf.status] ?? pf.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

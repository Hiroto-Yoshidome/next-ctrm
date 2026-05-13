"use client";

import { useState, useEffect, useCallback } from "react";
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
  status: string;
}

interface FilterState {
  contractRef: string;
  side: string;
  tradeForm: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const SIDE_LABELS: Record<string, string> = { BUY: "買", SELL: "売" };
const FORM_LABELS: Record<string, string> = { OVERSEAS: "三国間", IMPORT: "輸入", EXPORT: "輸出", DOMESTIC: "国内" };
const DELIVERY_LABELS: Record<string, string> = { DIRECT: "直送", STOCK: "在庫" };
const STATUS_LABELS: Record<string, string> = { DRAFT: "下書", CONFIRMED: "承認済", CLOSED: "決済済" };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

function fmt(v: string | null, decimals = 0) {
  if (v === null || v === undefined) return "—";
  const n = parseFloat(v);
  return isNaN(n) ? "—" : n.toLocaleString("ja-JP", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("ja-JP");
}

export default function ContractsListTab() {
  const { openTab } = useTab();
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    contractRef: "", side: "", tradeForm: "", status: "", dateFrom: "", dateTo: "",
  });

  const fetchData = useCallback(async (f: FilterState) => {
    setLoading(true);
    setSelected(new Set());
    const p = new URLSearchParams();
    if (f.contractRef) p.set("contractRef", f.contractRef);
    if (f.side) p.set("side", f.side);
    if (f.tradeForm) p.set("tradeForm", f.tradeForm);
    if (f.status) p.set("status", f.status);
    if (f.dateFrom) p.set("dateFrom", f.dateFrom);
    if (f.dateTo) p.set("dateTo", f.dateTo);
    const res = await fetch(`/api/contracts?${p.toString()}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(filter); }, []);

  function handleSearch() { fetchData(filter); }
  function handleClear() {
    const cleared = { contractRef: "", side: "", tradeForm: "", status: "", dateFrom: "", dateTo: "" };
    setFilter(cleared);
    fetchData(cleared);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const draftIds = data.filter((c) => c.status === "DRAFT").map((c) => c.id);
    const allSelected = draftIds.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(draftIds));
  }

  async function handleApprove() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`${ids.length}件の成約を承認しますか？`)) return;
    setApproving(true);
    const res = await fetch("/api/contracts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setApproving(false);
    if (res.ok) fetchData(filter);
  }

  const draftIds = data.filter((c) => c.status === "DRAFT").map((c) => c.id);
  const allDraftSelected = draftIds.length > 0 && draftIds.every((id) => selected.has(id));

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">成約一覧</h2>

      {/* 検索条件 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">成約Index</label>
            <input
              type="text"
              value={filter.contractRef}
              onChange={(e) => setFilter({ ...filter, contractRef: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="部分一致"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">売買区分</label>
            <select
              value={filter.side}
              onChange={(e) => setFilter({ ...filter, side: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="BUY">買</option>
              <option value="SELL">売</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">取引形態</label>
            <select
              value={filter.tradeForm}
              onChange={(e) => setFilter({ ...filter, tradeForm: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="OVERSEAS">三国間</option>
              <option value="IMPORT">輸入</option>
              <option value="EXPORT">輸出</option>
              <option value="DOMESTIC">国内</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ステータス</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="DRAFT">下書</option>
              <option value="CONFIRMED">承認済</option>
              <option value="CLOSED">決済済</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">成約日（From）</label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">成約日（To）</label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleSearch} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">検索</button>
          <button onClick={handleClear} className="px-4 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors">クリア</button>
        </div>
      </div>

      {/* ツールバー */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <button
          onClick={handleApprove}
          disabled={selected.size === 0 || approving}
          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          {approving ? "承認中..." : `選択を承認 (${selected.size}件)`}
        </button>
        <span className="text-sm text-gray-500">{loading ? "読み込み中..." : `${data.length}件`}</span>
      </div>

      {/* テーブル：ヘッダ固定・成約Index列固定・横スクロール */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        <table className="text-sm border-collapse" style={{ minWidth: "1200px" }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* チェックボックス列 - sticky */}
              <th className="sticky left-0 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 w-10">
                <input
                  type="checkbox"
                  checked={allDraftSelected}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              {/* 成約Index列 - sticky */}
              <th className="sticky left-10 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap min-w-[140px]">
                成約Index
              </th>
              {/* スクロール列 - sticky top のみ */}
              {[
                "売買", "取引形態", "直送/在庫", "成約日", "取引先",
                "数量(MT)", "通貨", "インコタームズ", "価格タイプ",
                "ベース指標", "プレミアム指標", "単価", "プレミアム",
                "QP開始日", "QP終了日", "ステータス",
              ].map((h) => (
                <th
                  key={h}
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={18} className="px-4 py-8 text-center text-gray-400">
                  データがありません
                </td>
              </tr>
            ) : data.map((c) => (
              <tr
                key={c.id}
                onDoubleClick={() =>
                  openTab("contract-detail", `${c.contractRef}`, { contractId: c.id })
                }
                className={`cursor-pointer hover:bg-blue-50 transition-colors ${selected.has(c.id) ? "bg-blue-50" : ""}`}
              >
                {/* チェックボックス - sticky */}
                <td className="sticky left-0 z-10 bg-white border-r border-gray-100 px-3 py-2 w-10"
                    style={{ backgroundColor: selected.has(c.id) ? "rgb(239 246 255)" : "white" }}>
                  {c.status === "DRAFT" && (
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  )}
                </td>
                {/* 成約Index - sticky */}
                <td
                  className="sticky left-10 z-10 border-r border-gray-100 px-3 py-2 font-mono text-blue-700 whitespace-nowrap min-w-[140px]"
                  style={{ backgroundColor: selected.has(c.id) ? "rgb(239 246 255)" : "white" }}
                >
                  {c.contractRef}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.side === "BUY" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                    {SIDE_LABELS[c.side] ?? c.side}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{FORM_LABELS[c.tradeForm] ?? c.tradeForm}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{DELIVERY_LABELS[c.deliveryType] ?? c.deliveryType}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{fmtDate(c.tradeDate)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.counterparty.name}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">{fmt(c.quantity, 3)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.currency}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.incoterms ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.priceType}</td>
                <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-700">{c.basePricingIndex.code}</td>
                <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-700">{c.premiumPricingIndex?.code ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">{fmt(c.unitPrice, 2)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">{fmt(c.premium, 2)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{fmtDate(c.qpStartDate)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{fmtDate(c.qpEndDate)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status] ?? ""}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

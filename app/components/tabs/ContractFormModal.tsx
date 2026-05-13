"use client";

import { useState, useEffect } from "react";

interface Counterparty { id: string; code: string; name: string; }
interface PricingIndex { id: string; code: string; name: string; isActive: boolean; }

interface FormData {
  contractRef: string;
  tradeForm: string;
  deliveryType: string;
  side: string;
  tradeDate: string;
  counterpartyCode: string;
  quantity: string;
  currency: string;
  incoterms: string;
  priceType: string;
  basePricingIndexCode: string;
  premiumPricingIndexCode: string;
  unitPrice: string;
  premium: string;
  qpStartDate: string;
  qpEndDate: string;
  memo: string;
}

const EMPTY: FormData = {
  contractRef: "", tradeForm: "IMPORT", deliveryType: "DIRECT", side: "BUY",
  tradeDate: "", counterpartyCode: "", quantity: "", currency: "USD",
  incoterms: "", priceType: "FIXED", basePricingIndexCode: "", premiumPricingIndexCode: "",
  unitPrice: "", premium: "", qpStartDate: "", qpEndDate: "", memo: "",
};

interface Props {
  mode: "create" | "edit";
  editContractId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500";
const SELECT = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

export default function ContractFormModal({ mode, editContractId, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [pricingIndices, setPricingIndices] = useState<PricingIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetches: Promise<unknown>[] = [
      fetch("/api/counterparties").then((r) => r.json()),
      fetch("/api/pricing-indices").then((r) => r.json()),
    ];
    if (mode === "edit" && editContractId) {
      fetches.push(fetch(`/api/contracts/${editContractId}`).then((r) => r.json()));
    }

    Promise.all(fetches).then(([cps, pis, contract]) => {
      setCounterparties(cps as Counterparty[]);
      setPricingIndices((pis as PricingIndex[]).filter((p) => p.isActive));

      if (contract) {
        const c = contract as {
          contractRef: string; tradeForm: string; deliveryType: string; side: string;
          tradeDate: string; counterparty: { code: string }; quantity: string;
          currency: string; incoterms: string | null; priceType: string;
          basePricingIndex: { code: string }; premiumPricingIndex: { code: string } | null;
          unitPrice: string | null; premium: string | null;
          qpStartDate: string | null; qpEndDate: string | null; memo: string | null;
        };
        setForm({
          contractRef: c.contractRef,
          tradeForm: c.tradeForm,
          deliveryType: c.deliveryType,
          side: c.side,
          tradeDate: c.tradeDate.slice(0, 10),
          counterpartyCode: c.counterparty.code,
          quantity: c.quantity,
          currency: c.currency,
          incoterms: c.incoterms ?? "",
          priceType: c.priceType,
          basePricingIndexCode: c.basePricingIndex.code,
          premiumPricingIndexCode: c.premiumPricingIndex?.code ?? "",
          unitPrice: c.unitPrice ?? "",
          premium: c.premium ?? "",
          qpStartDate: c.qpStartDate ? c.qpStartDate.slice(0, 10) : "",
          qpEndDate: c.qpEndDate ? c.qpEndDate.slice(0, 10) : "",
          memo: c.memo ?? "",
        });
      }
      setLoading(false);
    });
  }, [mode, editContractId]);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = mode === "create" ? "/api/contracts" : `/api/contracts/${editContractId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const json = await res.json();
      setError(json.error ?? "保存に失敗しました");
    }
  }

  const activePricingIndices = pricingIndices.filter((p) => p.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダ */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {mode === "create" ? "成約 新規登録" : "成約 編集"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">読み込み中...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">

              <Field label="成約Index" required>
                <input className={INPUT} value={form.contractRef} onChange={(e) => set("contractRef", e.target.value)} placeholder="CTR-2026-001" />
              </Field>

              <Field label="成約日" required>
                <input type="date" className={INPUT} value={form.tradeDate} onChange={(e) => set("tradeDate", e.target.value)} />
              </Field>

              <Field label="取引形態" required>
                <select className={SELECT} value={form.tradeForm} onChange={(e) => set("tradeForm", e.target.value)}>
                  <option value="OVERSEAS">三国間 (OVERSEAS)</option>
                  <option value="IMPORT">輸入 (IMPORT)</option>
                  <option value="EXPORT">輸出 (EXPORT)</option>
                  <option value="DOMESTIC">国内 (DOMESTIC)</option>
                </select>
              </Field>

              <Field label="直送/在庫区分" required>
                <select className={SELECT} value={form.deliveryType} onChange={(e) => set("deliveryType", e.target.value)}>
                  <option value="DIRECT">直送</option>
                  <option value="STOCK">在庫</option>
                </select>
              </Field>

              <Field label="売買区分" required>
                <select className={SELECT} value={form.side} onChange={(e) => set("side", e.target.value)}>
                  <option value="BUY">買</option>
                  <option value="SELL">売</option>
                </select>
              </Field>

              <Field label="取引先" required>
                <select className={SELECT} value={form.counterpartyCode} onChange={(e) => set("counterpartyCode", e.target.value)}>
                  <option value="">選択してください</option>
                  {counterparties.map((cp) => (
                    <option key={cp.id} value={cp.code}>{cp.code} — {cp.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="数量 (MT)" required>
                <input type="number" min="0" step="any" className={INPUT} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="500" />
              </Field>

              <Field label="通貨" required>
                <select className={SELECT} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="JPY">JPY</option>
                </select>
              </Field>

              <Field label="インコタームズ">
                <input className={INPUT} value={form.incoterms} onChange={(e) => set("incoterms", e.target.value)} placeholder="CIF" />
              </Field>

              <Field label="価格タイプ" required>
                <select className={SELECT} value={form.priceType} onChange={(e) => set("priceType", e.target.value)}>
                  <option value="FIXED">FIXED</option>
                  <option value="UNFIXED">UNFIXED</option>
                </select>
              </Field>

              <Field label="ベース評価指標" required>
                <select className={SELECT} value={form.basePricingIndexCode} onChange={(e) => set("basePricingIndexCode", e.target.value)}>
                  <option value="">選択してください</option>
                  {activePricingIndices.map((pi) => (
                    <option key={pi.id} value={pi.code}>{pi.code} — {pi.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="プレミアム評価指標">
                <select className={SELECT} value={form.premiumPricingIndexCode} onChange={(e) => set("premiumPricingIndexCode", e.target.value)}>
                  <option value="">なし</option>
                  {activePricingIndices.map((pi) => (
                    <option key={pi.id} value={pi.code}>{pi.code} — {pi.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="単価" required>
                <input type="number" step="any" className={INPUT} value={form.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} placeholder="9500" />
              </Field>

              <Field label="プレミアム">
                <input type="number" step="any" className={INPUT} value={form.premium} onChange={(e) => set("premium", e.target.value)} placeholder="50" />
              </Field>

              {form.priceType === "UNFIXED" && (
                <>
                  <Field label="QP開始日" required>
                    <input type="date" className={INPUT} value={form.qpStartDate} onChange={(e) => set("qpStartDate", e.target.value)} />
                  </Field>
                  <Field label="QP終了日" required>
                    <input type="date" className={INPUT} value={form.qpEndDate} onChange={(e) => set("qpEndDate", e.target.value)} />
                  </Field>
                </>
              )}

              <div className="col-span-2">
                <Field label="備考">
                  <input className={INPUT} value={form.memo} onChange={(e) => set("memo", e.target.value)} placeholder="自由記入" />
                </Field>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </form>
        )}

        {/* フッタ */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-1.5 border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving || loading}
            className="px-5 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : mode === "create" ? "登録" : "更新"}
          </button>
        </div>
      </div>
    </div>
  );
}

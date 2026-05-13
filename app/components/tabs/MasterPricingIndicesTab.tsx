"use client";

import { useState, useEffect, useCallback } from "react";

interface PricingIndex {
  id: string;
  code: string;
  name: string;
  unit: string;
  isActive: boolean;
}

export default function MasterPricingIndicesTab() {
  const [data, setData] = useState<PricingIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", name: "", unit: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unit: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pricing-indices");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!form.code.trim() || !form.name.trim() || !form.unit.trim()) {
      setError("コード・名称・単位は必須です");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/pricing-indices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setForm({ code: "", name: "", unit: "" }); fetchData(); }
    else { const j = await res.json(); setError(j.error ?? "登録に失敗しました"); }
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    const res = await fetch(`/api/pricing-indices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) { setEditId(null); fetchData(); }
    else { const j = await res.json(); alert(j.error ?? "更新に失敗しました"); }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`「${code}」を削除しますか？`)) return;
    const res = await fetch(`/api/pricing-indices/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
    else { const j = await res.json(); alert(j.error ?? "削除に失敗しました"); }
  }

  function startEdit(pi: PricingIndex) {
    setEditId(pi.id);
    setEditForm({ name: pi.name, unit: pi.unit, isActive: pi.isActive });
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">評価指標マスタ</h2>

      {/* 新規登録フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">新規登録</h3>
        <div className="flex gap-3 items-end">
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">コード *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="LME_COPPER"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LME銅"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs text-gray-500 mb-1">単位 *</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="USD/MT"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "登録中..." : "登録"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">コード</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">名称</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">単位</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">有効</th>
                <th className="px-4 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">登録されていません</td></tr>
              ) : data.map((pi) => (
                <tr key={pi.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-800">{pi.code}</td>
                  <td className="px-4 py-2">
                    {editId === pi.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : pi.name}
                  </td>
                  <td className="px-4 py-2">
                    {editId === pi.id ? (
                      <input
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : pi.unit}
                  </td>
                  <td className="px-4 py-2">
                    {editId === pi.id ? (
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      />
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs ${pi.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {pi.isActive ? "有効" : "無効"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {editId === pi.id ? (
                        <>
                          <button onClick={() => handleUpdate(pi.id)} disabled={saving} className="text-blue-600 hover:underline text-xs">保存</button>
                          <button onClick={() => setEditId(null)} className="text-gray-500 hover:underline text-xs">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(pi)} className="text-blue-600 hover:underline text-xs">編集</button>
                          <button onClick={() => handleDelete(pi.id, pi.code)} className="text-red-500 hover:underline text-xs">削除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

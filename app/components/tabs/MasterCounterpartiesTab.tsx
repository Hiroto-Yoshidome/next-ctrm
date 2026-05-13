"use client";

import { useState, useEffect, useCallback } from "react";

interface Counterparty {
  id: string;
  name: string;
  country: string | null;
  createdAt: string;
}

export default function MasterCounterpartiesTab() {
  const [data, setData] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", country: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/counterparties");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave() {
    if (!form.name.trim()) { setError("取引先名は必須です"); return; }
    setSaving(true);
    setError("");
    const res = await fetch(
      editId ? `/api/counterparties/${editId}` : "/api/counterparties",
      { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
    );
    setSaving(false);
    if (res.ok) {
      setForm({ name: "", country: "" });
      setEditId(null);
      fetchData();
    } else {
      const json = await res.json();
      setError(json.error ?? "保存に失敗しました");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const res = await fetch(`/api/counterparties/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
    else {
      const json = await res.json();
      alert(json.error ?? "削除に失敗しました");
    }
  }

  function startEdit(cp: Counterparty) {
    setEditId(cp.id);
    setForm({ name: cp.name, country: cp.country ?? "" });
    setError("");
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ name: "", country: "" });
    setError("");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">取引先マスタ</h2>

      {/* フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {editId ? "編集" : "新規登録"}
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">取引先名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC Trading Co."
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">国</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Japan"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : editId ? "更新" : "登録"}
          </button>
          {editId && (
            <button
              onClick={cancelEdit}
              className="px-4 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          )}
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
                <th className="text-left px-4 py-2 font-medium text-gray-600">取引先名</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">国</th>
                <th className="px-4 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">登録されていません</td></tr>
              ) : data.map((cp) => (
                <tr key={cp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{cp.name}</td>
                  <td className="px-4 py-2 text-gray-500">{cp.country ?? "—"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => startEdit(cp)} className="text-blue-600 hover:underline text-xs">編集</button>
                      <button onClick={() => handleDelete(cp.id, cp.name)} className="text-red-500 hover:underline text-xs">削除</button>
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

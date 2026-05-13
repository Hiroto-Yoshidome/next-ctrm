"use client";

import { useState, useEffect, useCallback } from "react";

interface Counterparty {
  id: string;
  code: string;
  name: string;
  country: string | null;
  createdAt: string;
}

export default function MasterCounterpartiesTab() {
  const [data, setData] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", name: "", country: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", country: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/counterparties");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate() {
    if (!form.code.trim() || !form.name.trim()) { setError("コード・取引先名は必須です"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/counterparties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ code: "", name: "", country: "" });
      fetchData();
    } else {
      const json = await res.json();
      setError(json.error ?? "保存に失敗しました");
    }
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) { setError("取引先名は必須です"); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/counterparties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) { setEditId(null); fetchData(); }
    else { const json = await res.json(); setError(json.error ?? "更新に失敗しました"); }
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
    setEditForm({ name: cp.name, country: cp.country ?? "" });
    setError("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ name: "", country: "" });
    setError("");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">取引先マスタ</h2>

      {/* 新規登録フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">新規登録</h3>
        <div className="flex gap-3 items-end">
          <div className="w-32">
            <label className="block text-xs text-gray-500 mb-1">コード *</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="ABC"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">取引先名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABC Trading Co."
            />
          </div>
          <div className="w-28">
            <label className="block text-xs text-gray-500 mb-1">国</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Japan"
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
                <th className="text-left px-4 py-2 font-medium text-gray-600">取引先名</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">国</th>
                <th className="px-4 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">登録されていません</td></tr>
              ) : data.map((cp) => (
                <tr key={cp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-800">{cp.code}</td>
                  <td className="px-4 py-2">
                    {editId === cp.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                      />
                    ) : cp.name}
                  </td>
                  <td className="px-4 py-2">
                    {editId === cp.id ? (
                      <input
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="Japan"
                      />
                    ) : (cp.country ?? "—")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {editId === cp.id ? (
                        <>
                          <button onClick={() => handleUpdate(cp.id)} disabled={saving} className="text-blue-600 hover:underline text-xs">保存</button>
                          <button onClick={cancelEdit} className="text-gray-500 hover:underline text-xs">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cp)} className="text-blue-600 hover:underline text-xs">編集</button>
                          <button onClick={() => handleDelete(cp.id, cp.name)} className="text-red-500 hover:underline text-xs">削除</button>
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

"use client";

import { useState, useRef } from "react";

interface ValidationError {
  sheet: string;
  row: number;
  message: string;
}

export default function ContractsUploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported?: number; expenses?: number; errors?: ValidationError[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/contracts/upload", { method: "POST", body: fd });
    const json = await res.json();
    setResult(json);
    setUploading(false);

    if (res.ok) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">成約アップロード</h2>
      <p className="text-sm text-gray-500 mb-6">Excelファイル（2シート構成）をアップロードして成約データを一括登録します</p>

      {/* フォーマット説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <p className="font-medium mb-2">Excelフォーマット</p>
        <p className="mb-1"><span className="font-medium">Sheet1（成約）:</span> A:成約Index / B:取引形態 / C:直送在庫区分 / D:売買区分 / E:成約日 / F:取引先コード / G:数量 / H:通貨 / I:インコタームズ / J:価格タイプ / K:ベース評価指標コード / L:プレミアム評価指標コード / M:単価 / N:プレミアム / O:QP開始日 / P:QP終了日 / Q:備考</p>
        <p><span className="font-medium">Sheet2（予定諸掛）:</span> A:成約Index / B:費目 / C:数量単位 / D:単価 / E:通貨</p>
      </div>

      {/* ファイル選択 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Excelファイルを選択</label>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {file && <p className="mt-2 text-sm text-gray-600">選択: {file.name}</p>}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {uploading ? "アップロード中..." : "アップロード・取込"}
      </button>

      {/* 結果表示 */}
      {result && (
        <div className="mt-6">
          {result.errors ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-3">
                取込エラー（{result.errors.length}件）— データは登録されていません
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">
                    [{e.sheet}] 行{e.row}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">
                取込完了 — 成約 {result.imported}件、予定諸掛 {result.expenses}件を登録しました
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

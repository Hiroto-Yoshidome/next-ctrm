"use client";

export default function DashboardTab() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">ダッシュボード</h1>
      <p className="text-sm text-gray-500 mb-8">Next-CTRM — 銅トレーディング管理システム</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "ネットポジション", value: "—", unit: "MT" },
          { label: "未実現P&L", value: "—", unit: "USD" },
          { label: "未値決め残高", value: "—", unit: "MT" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {card.value}
              <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

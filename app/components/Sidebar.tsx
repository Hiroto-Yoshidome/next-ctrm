"use client";

import { useTab, type TabType } from "@/app/contexts/TabContext";

const navItems: { label: string; type: TabType; title: string }[] = [
  { label: "ダッシュボード", type: "dashboard", title: "ダッシュボード" },
  { label: "成約一覧", type: "contracts-list", title: "成約一覧" },
  { label: "成約アップロード", type: "contracts-upload", title: "成約アップロード" },
  { label: "取引先マスタ", type: "master-counterparties", title: "取引先マスタ" },
  { label: "評価指標マスタ", type: "master-pricing-indices", title: "評価指標マスタ" },
];

export default function Sidebar() {
  const { openTab, tabs, activeTabId } = useTab();

  return (
    <aside className="w-52 min-h-screen bg-gray-900 text-gray-100 flex flex-col shrink-0">
      <div className="px-4 py-4 border-b border-gray-700">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Next-CTRM</p>
        <p className="text-xs text-gray-500 mt-0.5">銅トレーディング管理</p>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = tabs.some(
            (t) => t.id === activeTabId && t.type === item.type
          );
          return (
            <button
              key={item.type}
              onClick={() => openTab(item.type, item.title)}
              className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors text-left ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

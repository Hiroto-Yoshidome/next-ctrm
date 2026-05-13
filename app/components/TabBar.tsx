"use client";

import { useTab } from "@/app/contexts/TabContext";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTab();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end gap-0.5 px-2 bg-gray-100 border-b border-gray-300 overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none border-t border-x rounded-t whitespace-nowrap transition-colors ${
              isActive
                ? "bg-white border-gray-300 text-gray-800 font-medium"
                : "bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span>{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="text-gray-400 hover:text-gray-700 leading-none"
              aria-label="タブを閉じる"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

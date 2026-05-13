"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type TabType =
  | "dashboard"
  | "contracts-list"
  | "contract-detail"
  | "master-counterparties"
  | "master-pricing-indices"
  | "contracts-upload";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  props?: Record<string, string>;
}

interface TabContextValue {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (type: TabType, title: string, props?: Record<string, string>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

let tabCounter = 0;
function newTabId() {
  return `tab-${++tabCounter}`;
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback(
    (type: TabType, title: string, props?: Record<string, string>) => {
      setTabs((prev) => {
        // 同一タイプ + 同一propsのタブが既にあれば切り替えるだけ
        const existing = prev.find(
          (t) =>
            t.type === type &&
            JSON.stringify(t.props) === JSON.stringify(props)
        );
        if (existing) {
          setActiveTabId(existing.id);
          return prev;
        }
        const newTab: Tab = { id: newTabId(), type, title, props };
        setActiveTabId(newTab.id);
        return [...prev, newTab];
      });
    },
    []
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (activeTabId === id) {
          const nextActive = next[Math.max(0, idx - 1)];
          setActiveTabId(nextActive?.id ?? null);
        }
        return next;
      });
    },
    [activeTabId]
  );

  return (
    <TabContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTab: setActiveTabId }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTab must be used within TabProvider");
  return ctx;
}

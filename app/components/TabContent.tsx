"use client";

import { useTab, type Tab } from "@/app/contexts/TabContext";
import dynamic from "next/dynamic";

const DashboardTab = dynamic(() => import("./tabs/DashboardTab"));
const ContractsListTab = dynamic(() => import("./tabs/ContractsListTab"));
const ContractDetailTab = dynamic(() => import("./tabs/ContractDetailTab"));
const MasterCounterpartiesTab = dynamic(() => import("./tabs/MasterCounterpartiesTab"));
const MasterPricingIndicesTab = dynamic(() => import("./tabs/MasterPricingIndicesTab"));
const ContractsUploadTab = dynamic(() => import("./tabs/ContractsUploadTab"));

function TabPane({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case "dashboard":
      return <DashboardTab />;
    case "contracts-list":
      return <ContractsListTab />;
    case "contract-detail":
      return <ContractDetailTab contractId={tab.props?.contractId ?? ""} />;
    case "master-counterparties":
      return <MasterCounterpartiesTab />;
    case "master-pricing-indices":
      return <MasterPricingIndicesTab />;
    case "contracts-upload":
      return <ContractsUploadTab />;
    default:
      return null;
  }
}

export default function TabContent() {
  const { tabs, activeTabId } = useTab();

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        左のメニューからページを開いてください
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`absolute inset-0 overflow-auto p-6 ${
            tab.id === activeTabId ? "block" : "hidden"
          }`}
        >
          <TabPane tab={tab} />
        </div>
      ))}
    </div>
  );
}

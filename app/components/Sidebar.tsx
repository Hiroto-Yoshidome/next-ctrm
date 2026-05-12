"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/contracts", label: "成約管理" },
  { href: "/price-fix", label: "値決め管理" },
  { href: "/realize", label: "計上管理" },
  { href: "/positions", label: "ポジション" },
  { href: "/mtm", label: "MTM評価" },
  { href: "/reports", label: "帳票出力" },
  { href: "/upload", label: "アップロード" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Next-CTRM</p>
        <p className="text-xs text-gray-500 mt-0.5">銅トレーディング管理</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

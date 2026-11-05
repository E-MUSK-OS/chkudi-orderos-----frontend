"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductActiveTab = "general" | "kardex";

interface ProductTabsNavProps {
  activeTab: ProductActiveTab;
  onTabChange: (tab: ProductActiveTab) => void;
  className?: string;
}

export default function ProductTabsNav({
  activeTab,
  onTabChange,
  className,
}: ProductTabsNavProps) {
  const tabs: {
    id: ProductActiveTab;
    label: string;
  }[] = [
    {
      id: "general",
      label: "General",
    },
    {
      id: "kardex",
      label: "Kardex",
    },
  ];

  return (
    <div className={cn("w-full py-1", className)}>
      <div className="w-full rounded-2xl sm:rounded-full bg-white dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] p-1.5 flex items-center justify-between shadow-xs gap-1 sm:gap-2 select-none overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-[#0A0E1A] text-[#E8C16D] shadow-md border border-[#0A0E1A] dark:bg-[#E8C16D] dark:text-[#0A0E1A] dark:border-[#E8C16D] dark:shadow-[0_0_16px_rgba(232,193,109,0.4)]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.05] border border-transparent font-medium"
              )}
            >
              {isActive ? (
                <CheckCircle2 size={16} className="text-[#E8C16D] dark:text-[#0A0E1A] shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

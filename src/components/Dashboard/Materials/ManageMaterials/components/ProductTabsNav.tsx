"use client";

import React from "react";
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
      <div className="grid grid-cols-2 gap-2 w-full p-1.5 rounded-full bg-slate-100/90 dark:bg-[#12141C] border border-slate-200 dark:border-white/[0.08] shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 rounded-full text-xs sm:text-sm md:text-base font-bold transition-all duration-200 cursor-pointer select-none text-center",
                isActive
                  ? "bg-white text-[#0A0E1A] shadow-sm border border-slate-300 dark:border-slate-500/80 dark:bg-[#181B24] dark:text-white"
                  : "text-slate-500 hover:text-[#0A0E1A] dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]"
              )}
            >
              {/* Dashed Circle Indicator matching screenshot */}
              <span
                className={cn(
                  "w-4 h-4 rounded-full border border-dashed flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "border-[#B88728] dark:border-slate-300"
                    : "border-slate-400 dark:border-slate-600"
                )}
              >
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#B88728] dark:bg-white" />
                )}
              </span>

              <span className="tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Package, SlidersHorizontal } from "lucide-react";

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
    icon: typeof Package;
  }[] = [
    {
      id: "general",
      label: "General",
      icon: Package,
    },
    {
      id: "kardex",
      label: "Kardex",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className={cn("w-full py-1", className)}>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full p-1.5 sm:p-2 rounded-2xl bg-slate-100/90 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 px-4 rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all duration-200 cursor-pointer select-none text-center",
                isActive
                  ? "bg-white text-[#0A0E1A] shadow-sm border border-slate-200/90 dark:bg-[#131926] dark:text-[#F5C451] dark:border-[#F5C451]/30 dark:shadow-md"
                  : "text-slate-500 hover:text-[#0A0E1A] dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.04]"
              )}
            >
              {/* Radio / Circle indicator */}
              <span
                className={cn(
                  "w-4 h-4 rounded-full border border-dashed flex items-center justify-center shrink-0 transition-colors",
                  isActive
                    ? "border-[#B88728] dark:border-[#F5C451]"
                    : "border-slate-400 dark:border-slate-600"
                )}
              >
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#B88728] dark:bg-[#F5C451]" />
                )}
              </span>

              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-[#B88728] dark:text-[#F5C451]"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />

              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

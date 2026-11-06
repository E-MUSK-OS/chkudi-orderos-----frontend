"use client";

import React from "react";
import { Database } from "lucide-react";

interface SettingMastersHeaderProps {
  activeGroupName?: string;
  totalGroupsCount?: number;
  totalOptionsCount?: number;
}

export default function SettingMastersHeader({
  activeGroupName = "Color",
  totalGroupsCount = 0,
  totalOptionsCount = 0,
}: SettingMastersHeaderProps) {
  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left side: Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Setting Masters
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <Database className="h-3.5 w-3.5" />
              {activeGroupName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Manage setting masters
          </p>
        </div>

        {/* Right side: Dynamic Group Info Pill matching Client Config action controls theme */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs ring-2 ring-[#E8C16D]/30 min-h-[40px] sm:min-h-[44px]">
            <Database className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span>
              Active Master: <span className="font-extrabold text-[#B88728] dark:text-[#E8C16D]">{activeGroupName}</span>
            </span>
            {totalOptionsCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-white/[0.06]">
                {totalOptionsCount} values
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ArrowLeft, Database } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left side: Back Button, Title & Subtitle */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Setting Masters
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage setting masters
          </p>
        </div>
      </div>

      {/* Right side: Dynamic Group Info Pill */}
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#080B11] text-xs font-bold text-[#0A0E1A] dark:text-white shadow-xs">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]">
            <Database className="h-3 w-3" />
          </div>
          <span>
            Active Master: <span className="text-[#B88728] dark:text-[#E8C16D] font-extrabold">{activeGroupName}</span>
          </span>
          {totalOptionsCount > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-white/[0.06]">
              {totalOptionsCount} values
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

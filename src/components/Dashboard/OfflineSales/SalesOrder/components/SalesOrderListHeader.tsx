"use client";

import React from "react";
import { Plus, Download, ClipboardList } from "lucide-react";

interface SalesOrderListHeaderProps {
  onCreate: () => void;
  onDownload: () => void;
}

export default function SalesOrderListHeader({
  onCreate,
  onDownload,
}: SalesOrderListHeaderProps) {
  return (
    <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <ClipboardList className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white truncate">
              Order [ Sale ]
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage sale orders
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-4 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
          >
            <Download size={16} className="text-[#B88728] dark:text-[#E8C16D]" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
          >
            <Plus size={18} />
            <span>Create</span>
          </button>
        </div>
      </div>
    </section>
  );
}

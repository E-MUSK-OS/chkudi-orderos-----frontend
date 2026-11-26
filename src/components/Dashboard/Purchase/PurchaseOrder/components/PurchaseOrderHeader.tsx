"use client";

import React from "react";
import { Download, ShoppingBag } from "lucide-react";

interface PurchaseOrderHeaderProps {
  onDownload: () => void;
  onCreateOrder?: () => void;
}

export default function PurchaseOrderHeader({
  onDownload,
  onCreateOrder,
}: PurchaseOrderHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] shadow-xs">
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
          <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Order [ Purchase Product ]
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage purchase finishgood orders
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] transition-all shadow-xs cursor-pointer active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Upload } from "lucide-react";

export default function RequestedPOHeader() {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          {/* Breadcrumb matching Product Analytics Amazon */}

          <div className="flex items-center gap-2.5 pt-0.5">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0 shadow-xs">
              <Upload className="h-5 w-5 stroke-[2.2]" />
            </div>
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Upload Requested PO
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Upload and manage requested purchase orders for webstores.
          </p>
        </div>
      </div>
    </div>
  );
}

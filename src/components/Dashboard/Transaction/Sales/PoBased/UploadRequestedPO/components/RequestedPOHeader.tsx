"use client";

import React from "react";
import { Upload } from "lucide-react";
import Link from "next/link";

export default function RequestedPOHeader() {
  return (
    <div className="border-t-2 border-t-[#C2410C] bg-white dark:bg-[#0F1626] border-b border-slate-200 dark:border-white/[0.08] px-4 py-3 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <Upload className="h-6 w-6 text-[#DC2626] dark:text-[#F87171] stroke-[2.2]" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Upload Requested PO
        </h1>
      </div>

      {/* Breadcrumb matching Screenshot */}
      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
        <Link href="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          Transaction
        </Link>
        <span>/</span>
        <span className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          Sales
        </span>
        <span>/</span>
        <span className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          PO Based
        </span>
        <span>/</span>
        <span className="font-semibold text-[#008ECC] dark:text-[#38BDF8]">
          Upload Requested PO
        </span>
      </div>
    </div>
  );
}

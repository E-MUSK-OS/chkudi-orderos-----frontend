"use client";

import React from "react";
import { Plus, Download, Building2 } from "lucide-react";

interface CompanyProfileHeaderProps {
  onCreateClick: () => void;
  onDownloadListings?: () => void;
}

export default function CompanyProfileHeader({
  onCreateClick,
  onDownloadListings,
}: CompanyProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
      {/* Title & Breadcrumbs matching Webstore */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Company Profile
          </h1>
        </div>

        {/* Breadcrumb matching system style: Setting / Manage Company / Company Profile */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Setting
          </span>
          <span>/</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Manage Company
          </span>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-semibold">
            Company Profile
          </span>
        </div>
      </div>

      {/* Top Right Action Buttons matching Webstore header */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {onDownloadListings && (
          <button
            type="button"
            onClick={onDownloadListings}
            className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
          >
            <Download size={16} />
            Download Existing Listing [All]
          </button>
        )}

        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.97] text-slate-900 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shrink-0"
        >
          <Plus size={18} className="stroke-[3]" />
          Create Company
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Download, Upload, Users, FileSpreadsheet } from "lucide-react";

interface SalariedEmployeeHeaderProps {
  onDownloadTemplate?: () => void;
  onUploadClick?: () => void;
}

export default function SalariedEmployeeHeader({
  onDownloadTemplate,
  onUploadClick,
}: SalariedEmployeeHeaderProps) {
  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title & Breadcrumbs matching Employee Profile & Ledger Book theme */}
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Salaried Employee
            </h1>
          </div>

          {/* One line page description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
            Manage salaried staff records, monthly attendance tracking, and wage structures.
          </p>
        </div>

        {/* Action Buttons matching theme */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Upload Excel Button */}
          <Link
            href="/dashboard/settings/upload-excel?tab=salaried"
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0"
            title="Upload Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Upload Excel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

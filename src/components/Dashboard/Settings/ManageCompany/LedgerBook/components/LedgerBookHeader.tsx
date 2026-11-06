"use client";

import React from "react";
import Link from "next/link";
import { Download, Upload, Plus, BookOpen, FileSpreadsheet } from "lucide-react";

interface LedgerBookHeaderProps {
  onCreateClick: () => void;
  onDownloadTemplate?: () => void;
  onUploadClick?: () => void;
}

export default function LedgerBookHeader({
  onCreateClick,
  onDownloadTemplate,
  onUploadClick,
}: LedgerBookHeaderProps) {
  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title & Breadcrumbs matching Company Profile theme */}
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Ledger Book
            </h1>
          </div>

          {/* One line page description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
            Track and balance financial ledger books, debit and credit transaction records.
          </p>
        </div>

        {/* Top Right Action Buttons matching Company Profile theme */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Upload Excel Button */}
          <Link
            href="/dashboard/settings/upload-excel?tab=ledger"
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-[#0A0E1A] dark:border-white/[0.15] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#E8C16D] transition-all hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D] cursor-pointer shadow-xs"
            title="Upload Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Upload Excel</span>
          </Link>

          {/* Create Ledger Button */}
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0"
            title="Create New Ledger"
          >
            <Plus size={18} className="stroke-[3] text-[#0A0E1A]" />
            <span>Create Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
}

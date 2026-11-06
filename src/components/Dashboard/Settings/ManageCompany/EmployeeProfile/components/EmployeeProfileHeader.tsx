"use client";

import React from "react";
import Link from "next/link";
import { Plus, Users, FileSpreadsheet } from "lucide-react";

export default function EmployeeProfileHeader() {
  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title & Breadcrumbs matching Ledger Book & Company Profile theme */}
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Employee Profile
            </h1>
          </div>

          {/* One line page description */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
            Manage employee profiles, emergency contacts, identity documents, and credentials.
          </p>
        </div>

        {/* Action Button matching theme */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/dashboard/settings/upload-excel?tab=employee"
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 cursor-pointer shadow-xs"
            title="Upload Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Upload Excel</span>
          </Link>

          <Link
            href="/dashboard/setting/manage-company/employee-profile/new"
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create Employee</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

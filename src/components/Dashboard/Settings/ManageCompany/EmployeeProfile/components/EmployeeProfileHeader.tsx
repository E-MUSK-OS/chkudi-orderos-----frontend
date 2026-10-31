"use client";

import React from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default function EmployeeProfileHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
      {/* Title & Breadcrumb matching Ledger Book & Company Profile */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Profile
          </h1>
        </div>

        {/* Breadcrumb matching system style: Setting / Manage Company / Employee Profile */}
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
            Employee Profile
          </span>
        </div>
      </div>

      {/* Action Button matching theme */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/setting/manage-company/employee-profile/new"
          className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl bg-[#F5C451] hover:bg-[#E8B83D] active:scale-[0.98] text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-md shadow-[#F5C451]/10 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Create Employee</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default function EmployeeProfileHeader() {
  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title & Breadcrumbs matching Ledger Book & Company Profile theme */}
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Employee Profile
            </h1>
          </div>

          {/* Breadcrumb matching system style */}
          <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-1">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Setting
            </span>
            <span>/</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Manage Company
            </span>
            <span>/</span>
            <span className="text-[#B88728] dark:text-[#E8C16D] font-bold">
              Employee Profile
            </span>
          </div>
        </div>

        {/* Action Button matching theme */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
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

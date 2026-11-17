"use client";

import React from "react";
import { Crown, LayoutGrid, CheckCircle2 } from "lucide-react";
import type { ClientConfigStats } from "../types/clientConfiguration.types";

interface Props {
  stats: ClientConfigStats;
}

export default function ClientConfigStatsBanner({ stats }: Props) {
  const sectionPercentage =
    stats.totalSections > 0
      ? Math.round((stats.selectedSections / stats.totalSections) * 100)
      : 100;

  const routePercentage =
    stats.totalRoutes > 0
      ? Math.round((stats.grantedRoutes / stats.totalRoutes) * 100)
      : 100;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3">
      {/* Subscription Plan Card */}
      <article className="col-span-2 sm:col-span-1 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Subscription Plan
          </p>
          <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
            <Crown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 flex items-end justify-between gap-2">
          <h3 className="text-lg sm:text-2xl font-black text-[#0A0E1A] dark:text-white tracking-tight truncate">
            {stats.planName || "Enterprise Plus"}
          </h3>
          <span className="rounded-lg sm:rounded-xl border border-[#E8C16D]/30 bg-[#FFF9EC] dark:bg-[#1A160E] px-2 py-0.5 text-[10px] sm:text-xs font-bold text-[#B88728] dark:text-[#E8C16D] shrink-0 whitespace-nowrap">
            Active Plan
          </span>
        </div>
      </article>

      {/* Sections Selected Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/40 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Sections Selected
          </p>
          <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 shrink-0">
            <LayoutGrid className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
            <h3 className="text-lg sm:text-2xl font-black text-[#0A0E1A] dark:text-white">
              {stats.selectedSections}
            </h3>
            <span className="text-[11px] sm:text-sm font-bold text-slate-400 dark:text-slate-500">
              /{stats.totalSections}
            </span>
          </div>
          <span className="rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0 whitespace-nowrap">
            {sectionPercentage}% Active
          </span>
        </div>
      </article>

      {/* Routes Granted Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Routes Granted
          </p>
          <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
            <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.grantedRoutes}
            </h3>
            <span className="text-[11px] sm:text-sm font-bold text-slate-400 dark:text-slate-500">
              /{stats.totalRoutes}
            </span>
          </div>
          <span className="rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 whitespace-nowrap">
            {routePercentage}% Granted
          </span>
        </div>
      </article>
    </div>
  );
}

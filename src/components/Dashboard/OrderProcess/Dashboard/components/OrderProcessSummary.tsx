"use client";

import { Boxes, CalendarDays, CheckCircle2, Clock } from "lucide-react";

interface Props {
  totalOrders: number;
  todayOrders: number;
  scanned: number;
  pending: number;
  isLoading?: boolean;
}

export default function OrderProcessSummary({
  totalOrders,
  todayOrders,
  scanned,
  pending,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 sm:h-28 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Orders Card (All total orders according to active channel filter) */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-blue-500/10 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 truncate">
            Total Orders
          </p>
          <div className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 shrink-0">
            <Boxes className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-4 flex items-baseline sm:items-end justify-between gap-1.5 sm:gap-3">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
            {totalOrders}
          </h3>
          <span className="rounded-md sm:rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 shrink-0">
            Total
          </span>
        </div>
      </article>

      {/* 2. Today Orders Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-violet-500/10 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 truncate">
            Today Orders
          </p>
          <div className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20 shrink-0">
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-4 flex items-baseline sm:items-end justify-between gap-1.5 sm:gap-3">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
            {todayOrders}
          </h3>
          <span className="rounded-md sm:rounded-lg border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-violet-700 dark:text-violet-400 shrink-0">
            Today
          </span>
        </div>
      </article>

      {/* 3. Scanned Orders Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-emerald-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-emerald-500/10 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 truncate">
            Scanned Orders
          </p>
          <div className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-4 flex items-baseline sm:items-end justify-between gap-1.5 sm:gap-3">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
            {scanned}
          </h3>
          <span className="rounded-md sm:rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
            Scanned
          </span>
        </div>
      </article>

      {/* 4. Pending Orders Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-amber-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-amber-500/10 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 truncate">
            Pending Orders
          </p>
          <div className="grid h-6 w-6 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 shrink-0">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="mt-2 sm:mt-4 flex items-baseline sm:items-end justify-between gap-1.5 sm:gap-3">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
            {pending}
          </h3>
          <span className="rounded-md sm:rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-amber-800 dark:text-amber-400 shrink-0">
            Pending
          </span>
        </div>
      </article>
    </div>
  );
}

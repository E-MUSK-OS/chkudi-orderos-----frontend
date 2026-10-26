"use client";

import { Boxes, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Props {
  total: number;
  pending: number;
  scanned: number;
  missing?: number;
}

export default function ScanSummary({ total, pending, scanned, missing = 0 }: Props) {
  const hasMissing = missing > 0;

  return (
    <div
      className={`mb-6 grid grid-cols-1 gap-3 sm:gap-4 ${
        hasMissing ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
      }`}
    >
      {/* Total Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">Total Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
            <Boxes className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">{total}</h3>
          <span className="rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
            Total
          </span>
        </div>
      </article>

      {/* Scanned Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-emerald-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-emerald-500/10">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">Scanned Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">{scanned}</h3>
          <span className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            Scanned
          </span>
        </div>
      </article>

      {/* Pending Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-amber-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-amber-500/10">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">Pending Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">{pending}</h3>
          <span className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            Pending
          </span>
        </div>
      </article>

      {/* Missing Card */}
      {hasMissing && (
        <article className="rounded-2xl sm:rounded-3xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-red-300 dark:hover:border-red-500/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] dark:hover:shadow-red-500/10">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400">Missing / Unmatched</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{missing}</h3>
            <span className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
              Unmatched
            </span>
          </div>
        </article>
      )}
    </div>
  );
}

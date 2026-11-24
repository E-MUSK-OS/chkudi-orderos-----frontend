"use client";

import { Layers, CheckCircle2, Clock } from "lucide-react";
import { BatchProgressItem } from "../types";

interface Props {
  batches: BatchProgressItem[];
  isLoading?: boolean;
}

export default function BatchProgressSection({ batches, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-28 sm:w-32 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="h-5 w-16 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 sm:h-28 rounded-2xl bg-slate-50 dark:bg-white/[0.03] animate-pulse p-3.5"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-[#FFF9EC] dark:bg-[#E8C16D]/10 text-[#B88728] dark:text-[#F5C451] border border-[#E8C16D]/30 dark:border-[#E8C16D]/20 shrink-0">
            <Layers className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#0A0E1A] dark:text-white truncate">
            Batch Progress
          </h2>
        </div>
        <span className="rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
        </span>
      </div>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <div className="py-8 text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500">
          No batches found for this date.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
          {batches.map((batch) => {
            const isCompleted = batch.percentage === 100;
            const isAmazon = batch.channel === "amazon";

            return (
              <div
                key={batch.id}
                className="rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-3 sm:p-3.5 transition-all hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/50 hover:shadow-xs"
              >
                {/* Batch Name & Channel Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3
                    className="font-mono text-xs sm:text-sm font-black text-[#0A0E1A] dark:text-white truncate flex-1 min-w-0"
                    title={batch.batchNumber}
                  >
                    {batch.batchNumber}
                  </h3>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold border shrink-0 ${
                      isAmazon
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                        : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"
                    }`}
                  >
                    {isAmazon ? "Amazon" : "Flipkart"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/80 dark:bg-white/[0.08] h-1.5 sm:h-2 rounded-full overflow-hidden my-2 sm:my-2.5">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted ? "bg-emerald-500" : "bg-[#E8C16D]"
                    }`}
                    style={{ width: `${batch.percentage}%` }}
                  />
                </div>

                {/* Stats & Percentage */}
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="font-mono">
                      {batch.scanned} / {batch.total}
                    </span>
                  </div>
                  <span
                    className={`font-black ${
                      isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[#0A0E1A] dark:text-white"
                    }`}
                  >
                    {batch.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

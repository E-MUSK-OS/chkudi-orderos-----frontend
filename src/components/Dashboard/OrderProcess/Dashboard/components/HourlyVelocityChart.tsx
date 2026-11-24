"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { BatchProgressItem } from "../types";

interface Props {
  batches?: BatchProgressItem[];
  isLoading?: boolean;
}

export default function HourlyVelocityChart({
  batches = [],
  isLoading = false,
}: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Sort batches chronologically from oldest to newest for progressive velocity
  const sortedBatches = useMemo(() => {
    return [...batches].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [batches]);

  const maxScanned = useMemo(() => {
    return sortedBatches.reduce((max, b) => Math.max(max, b.scanned), 0) || 1;
  }, [sortedBatches]);

  const totalScanned = useMemo(() => {
    return sortedBatches.reduce((sum, b) => sum + b.scanned, 0);
  }, [sortedBatches]);

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-28 sm:w-36 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="h-5 w-20 sm:w-24 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
        </div>
        <div className="h-36 sm:h-44 w-full bg-slate-50 dark:bg-white/[0.02] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const selectedBatch =
    sortedBatches.find((b) => b.id === selectedBatchId) ||
    (sortedBatches.length > 0 ? sortedBatches[sortedBatches.length - 1] : null);

  return (
    <div className="h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm flex flex-col justify-between">
      {/* Header - Clean: Activity icon, Title, Scanned count */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
            <Activity className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#0A0E1A] dark:text-white truncate">
            Packing Velocity
          </h2>
        </div>

        <span className="rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-emerald-700 dark:text-emerald-400 shrink-0">
          {totalScanned} Scanned
        </span>
      </div>

      {/* Batch Velocity Capsules (Starting from the left side) */}
      {sortedBatches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 min-h-[140px]">
          No batch scan activity recorded yet.
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="pt-3 pb-2 px-1 flex items-end justify-start gap-3 sm:gap-6 border-b border-slate-100 dark:border-white/[0.06] overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            {sortedBatches.map((batch, index) => {
              const isSelected = selectedBatch?.id === batch.id;
              const heightPercent =
                batch.scanned > 0
                  ? Math.max(16, Math.round((batch.scanned / maxScanned) * 100))
                  : 6;
              const displayLabel = `Batch ${index + 1}`;

              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className="w-14 sm:w-20 shrink-0 flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
                  title={`${batch.batchNumber} (${batch.scanned} / ${batch.total} scanned)`}
                >
                  {/* Top: Scanned Units Value Badge */}
                  <div className="h-5 flex items-center justify-center">
                    <span
                      className={`text-[10px] sm:text-[11px] font-black font-mono px-1.5 py-0.2 rounded transition-all ${
                        isSelected
                          ? "bg-[#0A0E1A] text-white dark:bg-white dark:text-[#0A0E1A] shadow-xs scale-105"
                          : "text-[#0A0E1A] dark:text-white group-hover:scale-110"
                      }`}
                    >
                      {batch.scanned}
                    </span>
                  </div>

                  {/* Middle: Capsule Bar */}
                  <div className="w-full max-w-[28px] sm:max-w-[42px] h-24 sm:h-28 bg-slate-50 dark:bg-white/[0.02] rounded-full flex items-end justify-center p-0.5">
                    {batch.scanned > 0 ? (
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-t from-[#B88728] via-[#E8C16D] to-[#F5C451] shadow-md shadow-[#E8C16D]/30"
                            : "bg-gradient-to-t from-[#D4A33B] to-[#F5C451] dark:from-[#B88728] dark:to-[#E8C16D] opacity-90 group-hover:opacity-100"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    ) : (
                      <div className="w-full h-1.5 rounded-full bg-slate-200/50 dark:bg-white/[0.05]" />
                    )}
                  </div>

                  {/* Bottom: Batch Label (e.g. Batch 1, Batch 2) */}
                  <span
                    className={`text-[9px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap select-none transition-colors ${
                      isSelected
                        ? "text-[#0A0E1A] dark:text-white font-black"
                        : "text-slate-700 dark:text-slate-300 font-bold"
                    }`}
                  >
                    {displayLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Breakdown: Selected Batch Metrics */}
          {selectedBatch && (
            <div className="mt-3 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span
                className="font-mono font-bold text-slate-600 dark:text-slate-400 truncate max-w-full sm:max-w-[200px]"
                title={selectedBatch.batchNumber}
              >
                {selectedBatch.batchNumber}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                <span className="font-black text-[#0A0E1A] dark:text-white">
                  {selectedBatch.scanned} / {selectedBatch.total} packed ({selectedBatch.percentage}%)
                </span>
                <span className="text-slate-400">•</span>
                <span
                  className={`font-bold uppercase ${
                    selectedBatch.channel === "amazon"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {selectedBatch.channel}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

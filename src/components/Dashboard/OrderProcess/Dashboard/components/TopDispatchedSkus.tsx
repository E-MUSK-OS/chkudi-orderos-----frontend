"use client";

import { PackageCheck } from "lucide-react";
import { TopDispatchedSkuItem } from "../types";

interface Props {
  topSkus: TopDispatchedSkuItem[];
  isLoading?: boolean;
}

export default function TopDispatchedSkus({ topSkus, isLoading = false }: Props) {
  if (isLoading) {
    return (
      <div className="h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-28 sm:w-32 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
          <div className="h-5 w-16 bg-slate-100 dark:bg-white/[0.05] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-slate-50 dark:bg-white/[0.02] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 shrink-0">
            <PackageCheck className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-[#0A0E1A] dark:text-white truncate">
            Top Dispatched SKUs
          </h2>
        </div>
        <span className="rounded-full border border-amber-200/80 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-400 shrink-0">
          Restock Alert
        </span>
      </div>

      {/* SKUs List - Compact, line by line with uniform small spacing */}
      {topSkus.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 min-h-[140px]">
          No dispatched SKUs recorded yet.
        </div>
      ) : (
        <div className="flex flex-col justify-start gap-1.5">
          {topSkus.slice(0, 5).map((item, index) => {
            const isAmazon = item.channel === "amazon";
            const isFlipkart = item.channel === "flipkart";

            return (
              <div
                key={item.sku}
                className="rounded-lg border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-[#080B11] px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 transition-colors hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/40"
              >
                {/* Left: Rank & SKU */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <span className="grid h-4 w-4 sm:h-5 sm:w-5 place-items-center rounded bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] text-[9px] sm:text-[10px] font-black text-[#0A0E1A] dark:text-white shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className="font-mono text-[11px] sm:text-xs font-bold text-[#0A0E1A] dark:text-white truncate"
                    title={item.sku}
                  >
                    {item.sku}
                  </span>
                </div>

                {/* Right: Channel & Quantity Badge */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {item.channel !== "all" && (
                    <span
                      className={`px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border ${isAmazon
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                        : isFlipkart
                          ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.1]"
                        }`}
                    >
                      {item.channel}
                    </span>
                  )}
                  {/* Quantity badge with high-contrast text */}
                  <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded bg-slate-100 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.1] px-1.5 sm:px-2 py-0.5 shadow-2xs">
                    <span className="text-[11px] sm:text-xs font-black text-[#0A0E1A] dark:text-white">
                      {item.count}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      units
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

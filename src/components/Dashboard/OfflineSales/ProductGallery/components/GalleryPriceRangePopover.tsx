"use client";

import React, { useMemo } from "react";

interface GalleryPriceRangePopoverProps {
  minBound: number;
  maxBound: number;
  valueMin: number;
  valueMax: number;
  prices: number[];
  onChange: (nextMin: number, nextMax: number) => void;
  onReset: () => void;
}

export default function GalleryPriceRangePopover({
  minBound,
  maxBound,
  valueMin,
  valueMax,
  prices,
  onChange,
  onReset,
}: GalleryPriceRangePopoverProps) {
  const safeMaxBound = Math.max(maxBound, minBound + 1);
  const clampedMin = Math.max(minBound, Math.min(valueMin, valueMax));
  const clampedMax = Math.min(safeMaxBound, Math.max(valueMax, clampedMin));

  // Build 18-bucket price distribution histogram (matching img-1)
  const buckets = useMemo(() => {
    const numBuckets = 18;
    const counts = new Array<number>(numBuckets).fill(0);
    const span = Math.max(1, safeMaxBound - minBound);

    for (const p of prices) {
      const idx = Math.min(
        numBuckets - 1,
        Math.max(0, Math.floor(((p - minBound) / span) * numBuckets))
      );
      counts[idx]++;
    }

    const maxCount = Math.max(1, ...counts);
    return counts.map((count, i) => {
      const bucketStart = minBound + (i / numBuckets) * span;
      const bucketEnd = minBound + ((i + 1) / numBuckets) * span;
      const isInRange =
        bucketEnd >= clampedMin && bucketStart <= clampedMax;
      const heightPct = count > 0 ? Math.max(16, Math.round((count / maxCount) * 100)) : 8;
      return { heightPct, isInRange };
    });
  }, [prices, minBound, safeMaxBound, clampedMin, clampedMax]);

  const leftPct = ((clampedMin - minBound) / (safeMaxBound - minBound)) * 100;
  const rightPct = ((clampedMax - minBound) / (safeMaxBound - minBound)) * 100;
  const isFiltered = valueMin > minBound || valueMax < maxBound;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-[260px] sm:w-[280px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#12161E] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          PRICE RANGE
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] font-bold text-[#B88728] dark:text-[#F5C451] hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Distribution Bars matching img-1 */}
      <div className="h-9 flex items-end gap-1 mb-2 px-0.5">
        {buckets.map((b, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-t-sm transition-colors ${
              b.isInRange
                ? "bg-[#E8C16D] dark:bg-slate-300"
                : "bg-slate-200 dark:bg-white/[0.14]"
            }`}
            style={{ height: `${b.heightPct}%` }}
          />
        ))}
      </div>

      {/* Dual Handle Range Track */}
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-white/[0.14] relative">
          <div
            className="absolute h-full rounded-full bg-[#E8C16D] dark:bg-white"
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(0, rightPct - leftPct)}%`,
            }}
          />
        </div>

        {/* Min Range Input */}
        <input
          type="range"
          min={minBound}
          max={safeMaxBound}
          value={clampedMin}
          onChange={(e) => {
            const nextMin = Math.min(Number(e.target.value), clampedMax);
            onChange(nextMin, clampedMax);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0A0E1A] dark:[&::-webkit-slider-thumb]:bg-[#12161E] dark:[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: clampedMin > safeMaxBound - 50 ? 5 : 3 }}
        />

        {/* Max Range Input */}
        <input
          type="range"
          min={minBound}
          max={safeMaxBound}
          value={clampedMax}
          onChange={(e) => {
            const nextMax = Math.max(Number(e.target.value), clampedMin);
            onChange(clampedMin, nextMax);
          }}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0A0E1A] dark:[&::-webkit-slider-thumb]:bg-[#12161E] dark:[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Min / Max Price Labels */}
      <div className="mt-1.5 flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
        <span>₹{clampedMin.toLocaleString("en-IN")}</span>
        <span>₹{maxBound === 0 ? 0 : clampedMax.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

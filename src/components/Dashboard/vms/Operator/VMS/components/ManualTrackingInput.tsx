"use client";

import { useState } from "react";
import { Keyboard, RotateCcw, Play, Info } from "lucide-react";

const ManualTrackingInput = () => {
  const [trackingId, setTrackingId] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!trackingId.trim()) return;

    console.log({
      trackingId,
      reason,
    });

    setTrackingId("");
    setReason("");
  };

  const handleClear = () => {
    setTrackingId("");
    setReason("");
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-orange-600 dark:text-orange-400" />

          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Manual Tracking Entry
          </h2>
        </div>

        <span className="rounded-full bg-orange-100 dark:bg-orange-950/40 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-400 border border-transparent dark:border-orange-900/40">
          Manual
        </span>
      </div>

      {/* Body */}
      <div className="space-y-5 p-5">
        {/* Tracking ID */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Tracking ID
          </label>

          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter tracking ID manually..."
            className="w-full rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white px-4 py-3 outline-none transition focus:border-orange-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Reason (Optional)
          </label>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Barcode damaged"
            className="w-full rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white px-4 py-3 outline-none transition focus:border-orange-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#080B11] transition hover:bg-gray-100 dark:hover:bg-white/[0.04] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 text-sm font-medium transition cursor-pointer"
          >
            <Play className="h-4 w-4" />
            Start Recording
          </button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 px-4 py-3 text-sm text-orange-700 dark:text-orange-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Use this option only when barcode scanning is unavailable or the
            barcode is damaged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualTrackingInput;
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-orange-600" />

          <h2 className="text-lg font-semibold text-gray-800">
            Manual Tracking Entry
          </h2>
        </div>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
          Manual
        </span>
      </div>

      {/* Body */}
      <div className="space-y-5 p-5">
        {/* Tracking ID */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tracking ID
          </label>

          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter tracking ID manually..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Reason (Optional)
          </label>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Barcode damaged"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
          >
            <Play className="h-4 w-4" />
            Start Recording
          </button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
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
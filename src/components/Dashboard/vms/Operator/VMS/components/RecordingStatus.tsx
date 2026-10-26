"use client";

import { CircleDot, Clock3, HardDrive, ScanLine, Video } from "lucide-react";

const RecordingStatus = () => {
  const recording = true;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/[0.08] px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Recording Status
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5">
        {/* Status */}
        <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <CircleDot
              className={`h-5 w-5 ${
                recording ? "text-red-500" : "text-gray-400 dark:text-slate-500"
              }`}
              fill={recording ? "currentColor" : "none"}
            />

            <span className="font-medium text-gray-700 dark:text-slate-300">Status</span>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              recording
                ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400"
            }`}
          >
            {recording ? "Recording" : "Idle"}
          </span>
        </div>

        {/* Tracking */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <ScanLine className="h-4 w-4" />
            Tracking ID
          </div>

          <span className="font-semibold text-gray-800 dark:text-white">
            TRK-202607050001
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <Clock3 className="h-4 w-4" />
            Duration
          </div>

          <span className="font-semibold text-slate-800 dark:text-white">00:00:18</span>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <HardDrive className="h-4 w-4" />
            Video Size
          </div>

          <span className="font-semibold text-slate-800 dark:text-white">24.8 MB</span>
        </div>

        {/* Resolution */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
            <Video className="h-4 w-4" />
            Resolution
          </div>

          <span className="font-semibold text-slate-800 dark:text-white">1920 × 1080</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingStatus;
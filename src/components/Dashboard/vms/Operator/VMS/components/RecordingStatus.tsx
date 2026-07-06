"use client";

import { CircleDot, Clock3, HardDrive, ScanLine, Video } from "lucide-react";

const RecordingStatus = () => {
  const recording = true;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Recording Status
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5">
        {/* Status */}
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <CircleDot
              className={`h-5 w-5 ${
                recording ? "text-red-500" : "text-gray-400"
              }`}
              fill={recording ? "currentColor" : "none"}
            />

            <span className="font-medium text-gray-700">Status</span>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              recording
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {recording ? "Recording" : "Idle"}
          </span>
        </div>

        {/* Tracking */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <ScanLine className="h-4 w-4" />
            Tracking ID
          </div>

          <span className="font-semibold text-gray-800">
            TRK-202607050001
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock3 className="h-4 w-4" />
            Duration
          </div>

          <span className="font-semibold">00:00:18</span>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <HardDrive className="h-4 w-4" />
            Video Size
          </div>

          <span className="font-semibold">24.8 MB</span>
        </div>

        {/* Resolution */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Video className="h-4 w-4" />
            Resolution
          </div>

          <span className="font-semibold">1920 × 1080</span>
        </div>
      </div>
    </div>
  );
};

export default RecordingStatus;
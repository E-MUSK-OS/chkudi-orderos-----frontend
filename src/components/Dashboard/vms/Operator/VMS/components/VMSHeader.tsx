"use client";

import { Camera, Wifi } from "lucide-react";

const VMSHeader = () => {
  const cameraConnected = true;
  const internetOnline = true;

  return (
    <div className="flex items-center justify-end">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/30 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <Camera className="h-4 w-4 text-green-600 dark:text-green-400" />

          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {cameraConnected ? "Camera Connected" : "Camera Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/30 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />

          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {internetOnline ? "Internet Online" : "Internet Offline"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VMSHeader;
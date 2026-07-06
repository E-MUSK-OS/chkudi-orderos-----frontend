"use client";

import { History } from "lucide-react";

const recentScans = [
  {
    id: "TRK-202607050001",
    time: "10:42:15 AM",
    status: "Uploaded",
  },
  {
    id: "TRK-202607050002",
    time: "10:42:42 AM",
    status: "Uploading",
  },
  {
    id: "TRK-202607050003",
    time: "10:43:18 AM",
    status: "Recording",
  },
  {
    id: "TRK-202607050004",
    time: "10:43:56 AM",
    status: "Failed",
  },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Uploaded":
      return "bg-green-100 text-green-700";

    case "Uploading":
      return "bg-blue-100 text-blue-700";

    case "Recording":
      return "bg-red-100 text-red-700";

    case "Failed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const RecentScans = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-600" />

          <h2 className="text-lg font-semibold text-gray-800">
            Recent Scans
          </h2>
        </div>

        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          Today
        </span>
      </div>

      {/* Scan List */}
      <div className="divide-y divide-gray-100">
        {recentScans.map((scan) => (
          <div
            key={scan.id}
            className="flex items-center justify-between px-5 py-4"
          >
            <div>
              <p className="font-medium text-gray-800">{scan.id}</p>

              <p className="mt-1 text-xs text-gray-500">{scan.time}</p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                scan.status
              )}`}
            >
              {scan.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentScans;
"use client";

import { CloudUpload } from "lucide-react";

const uploads = [
  {
    id: "TRK-202607050001",
    progress: 72,
    status: "Uploading",
  },
  {
    id: "TRK-202607050002",
    progress: 0,
    status: "Pending",
  },
  {
    id: "TRK-202607050003",
    progress: 100,
    status: "Completed",
  },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Uploading":
      return "bg-blue-100 text-blue-700";

    case "Pending":
      return "bg-yellow-100 text-yellow-700";

    case "Completed":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const UploadQueue = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5 text-sky-600" />

          <h2 className="text-lg font-semibold text-gray-800">
            Upload Queue
          </h2>
        </div>

        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
          {uploads.length} Pending
        </span>
      </div>

      {/* Queue */}
      <div className="space-y-5 p-5">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                {upload.id}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                  upload.status
                )}`}
              >
                {upload.status}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: `${upload.progress}%`,
                }}
              />
            </div>

            <div className="text-right text-xs text-gray-500">
              {upload.progress}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadQueue;
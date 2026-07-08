"use client";

import { useVMSStore } from "../store/vmsStore";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
} from "lucide-react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          <Clock3 size={14} />
          Pending
        </span>
      );

    case "uploading":
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          <Loader2 size={14} className="animate-spin" />
          Uploading
        </span>
      );

    case "completed":
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} />
          Completed
        </span>
      );

    case "failed":
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle size={14} />
          Failed
        </span>
      );

    default:
      return null;
  }
};

const UploadQueue = () => {
  const { uploadQueue, removeUpload } = useVMSStore();

  return (
    <div className="mt-6 border border-[#C89B3C] p-5 shadow-sm">
      <h2 className="mb-4 text-xl">Upload Queue</h2>

      {uploadQueue.length === 0 ? (
        <p className="text-gray-500">No uploads yet.</p>
      ) : (
        <div className="space-y-3">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.trackingId}
                        className="h-20 w-32 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-gray-100">
                        No Preview
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">{item.trackingId}</p>

                      <p className="mt-1 text-sm text-gray-500">
                        Created :{new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {item.trackingId}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Created : {new Date(item.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {getStatusBadge(item.status)}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Upload Progress</span>

                  <span>{item.progress}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${item.progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Retry : {item.retryCount}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!item.videoUrl}
                    onClick={() => window.open(item.videoUrl, "_blank")}
                    className="rounded-lg border p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    disabled={item.status !== "completed" || !item.videoUrl}
                    onClick={() => {
                      useVMSStore.getState().updateUpload(item.id, {
                        status: "pending",
                        retryCount: item.retryCount + 1,
                        progress: 0,
                      });
                    }}
                    className="rounded-lg border p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button
                    onClick={() => removeUpload(item.id)}
                    className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadQueue;

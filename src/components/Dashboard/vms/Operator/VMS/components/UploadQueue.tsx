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
import { useUploadQueue } from "../hooks/useUploadQueue";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-900/40 bg-[#FFF9EC] dark:bg-amber-950/20 px-3 py-1 text-xs font-semibold text-[#B88728] dark:text-[#E8C16D]">
          <Clock3 size={13} />
          Pending
        </span>
      );

    case "uploading":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
          <Loader2 size={13} className="animate-spin" />
          Uploading
        </span>
      );

    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={13} />
          Completed
        </span>
      );

    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
          <XCircle size={13} />
          Failed
        </span>
      );

    default:
      return null;
  }
};

const UploadQueue = () => {
  const { uploadQueue, removeUpload } = useVMSStore();
  const { retryUpload } = useUploadQueue();

  return (
    <div className="mt-6 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#0A0E1A] dark:text-white">Upload Queue</h2>

      {uploadQueue.length === 0 ? (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">No uploads yet.</p>
      ) : (
        <div className="space-y-3">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 sm:p-5 shadow-xs transition hover:border-[#E8C16D]/40 hover:shadow-sm dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.trackingId}
                      className="h-20 w-32 rounded-xl border border-slate-200 dark:border-white/[0.08] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-xs font-medium text-slate-400 dark:text-slate-500">
                      No Preview
                    </div>
                  )}

                  <div>
                    <p className="font-mono text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                      {item.trackingId}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Created: {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {getStatusBadge(item.status)}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Upload Progress</span>
                  <span className="font-mono">{item.progress}%</span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E8C16D] to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${item.progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-3">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Retry: {item.retryCount}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!item.videoUrl}
                    onClick={() => window.open(item.videoUrl, "_blank")}
                    title="View Video"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-600 dark:text-slate-300 transition hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] hover:text-[#B88728] dark:hover:text-[#E8C16D] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    disabled={!["failed", "pending"].includes(item.status)}
                    onClick={() => retryUpload(item.id)}
                    title="Retry Upload"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-600 dark:text-slate-300 transition hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] hover:text-[#B88728] dark:hover:text-[#E8C16D] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    onClick={() => removeUpload(item.id)}
                    title="Remove Upload"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-400 dark:text-slate-500 transition hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={16} />
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

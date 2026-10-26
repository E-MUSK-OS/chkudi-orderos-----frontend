"use client";

import { useEffect } from "react";
import { CalendarDays, Clock3, Download, UserRound, X } from "lucide-react";
import { format } from "date-fns";

import Button from "@/components/ui/Button";
import { API_BASE_URL } from "@/lib/config";

const getFullUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

import type { VMSItem } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VMSItem | null;
}

export default function PreviewDialog({ open, onOpenChange, item }: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open || !item) return null;

  const handleDownload = async () => {
    if (!item.videoUrl) return;

    try {
      const response = await fetch(getFullUrl(item.videoUrl)!, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.trackingId}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 sm:p-4 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="relative w-full max-w-5xl my-auto max-h-[calc(100dvh-1.25rem)] sm:max-h-[92vh] flex flex-col overflow-hidden border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#E8C16D] leading-tight">
              Video Preview
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-mono text-slate-300 truncate max-w-[220px] xs:max-w-xs sm:max-w-md">
              {item.trackingId}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="rounded-xl p-2 transition hover:bg-white/10 cursor-pointer text-slate-300 hover:text-white shrink-0 -mr-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3.5 sm:p-5 md:p-6 lg:p-7">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 items-start">
            {/* Video Container */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden border border-[#E7E0D2] dark:border-white/[0.08] bg-black rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center">
                {item.videoUrl ? (
                  <video
                    controls
                    playsInline
                    className="aspect-video w-full max-h-[48vh] sm:max-h-[56vh] object-contain bg-black"
                    src={getFullUrl(item.videoUrl) ?? undefined}
                    poster={getFullUrl(item.thumbnailUrl) ?? undefined}
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[#0A0E1A] dark:bg-[#080B11] p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                      <Clock3 className="h-6 w-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-300">
                      No video recording available
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.trackingId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="w-full">
              <div className="border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF9] dark:bg-[#080B11] p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                <p className="mb-3 sm:mb-4 text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] uppercase tracking-wider">
                  Scan Details
                </p>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#B88728] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Date
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {format(new Date(item.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Time
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {format(new Date(item.createdAt), "hh:mm:ss aa")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Operator
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.operator?.operatorName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Duration
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.duration ? `${item.duration}s` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-1 min-w-0 pt-2 border-t border-[#E7E0D2]/70 dark:border-white/[0.08]">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Tracking ID
                    </p>
                    <p className="break-all font-mono text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white mt-0.5">
                      {item.trackingId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-[#E7E0D2] dark:border-white/[0.08] px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-[#0F1626] shrink-0">
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-xl sm:rounded-2xl px-5 h-10 sm:h-11 text-xs sm:text-sm"
          >
            Close
          </Button>

          {item.videoUrl && (
            <a
              href={getFullUrl(item.videoUrl)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto block"
            >
              <Button
                type="button"
                variant="secondary"
                fullWidth={false}
                leftIcon={<Download size={16} />}
                onClick={handleDownload}
                className="w-full sm:w-auto bg-[#E8C16D] text-[#0A0E1A] font-bold hover:bg-[#d4af5a] shadow-sm rounded-xl sm:rounded-2xl px-5 h-10 sm:h-11 text-xs sm:text-sm"
              >
                Download
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { CalendarDays, Clock3, Download, UserRound, X } from "lucide-react";
import { format } from "date-fns";

import Button from "@/components/ui/Button";

import type { VMSItem } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VMSItem | null;
}

export default function PreviewDialog({ open, onOpenChange, item }: Props) {
  if (!open || !item) return null;

  const handleDownload = async () => {
    if (!item.videoUrl) return;

    try {
      const response = await fetch(item.videoUrl);

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${item.trackingId}.webm`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
      <div className="w-full max-w-5xl overflow-hidden border border-white/10 bg-[#0F172A] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">Video Preview</h2>

            <p className="mt-1 text-sm text-gray-400">{item.trackingId}</p>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 transition hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Body */}

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          {/* Video */}

          <div className="lg:col-span-2">
            <div className="overflow-hidden border border-white/10 bg-black">
              {item.videoUrl ? (
                <video
                  controls
                  className="aspect-video w-full"
                  src={item.videoUrl}
                  poster={item.thumbnailUrl ?? undefined}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-black text-gray-400">
                  Video Not Available
                </div>
              )}
            </div>
          </div>

          {/* Details */}

          <div className="space-y-4 h-full">
            <div className="border border-white/10 bg-[#111827] p-4">
              <p className="mb-3 text-sm font-semibold text-white">
                Scan Details
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-blue-400" />

                  <div>
                    <p className="text-xs text-gray-400">Date</p>

                    <p className="text-sm text-white">
                      {format(new Date(item.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-green-400" />

                  <div>
                    <p className="text-xs text-gray-400">Time</p>

                    <p className="text-sm text-white">
                      {format(new Date(item.createdAt), "hh:mm:ss aa")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 text-orange-400" />

                  <div>
                    <p className="text-xs text-gray-400">Operator</p>

                    <p className="text-sm text-white">
                      {item.operatorName || "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Tracking ID</p>

                  <p className="break-all text-sm font-medium text-white">
                    {item.trackingId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Duration</p>

                  <p className="text-sm text-white">{item.duration}s</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5">
          {item.videoUrl && (
            <a href={item.videoUrl} target="_blank" rel="noreferrer">
              <Button
                variant="secondary"
                fullWidth={false}
                leftIcon={<Download size={18} />}
                onClick={handleDownload}
              >
                Download
              </Button>
            </a>
          )}

          <Button
            variant="outline"
            fullWidth={false}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

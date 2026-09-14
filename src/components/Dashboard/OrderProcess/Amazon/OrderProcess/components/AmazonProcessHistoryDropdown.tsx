"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Clock,
  Calendar,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCw,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAmazonOrderStore } from "../store/useAmazonOrderStore";
import { AmazonBatchHistoryItem } from "../services/amazonOrder.service";

interface AmazonProcessHistoryDropdownProps {
  className?: string;
}

export default function AmazonProcessHistoryDropdown({
  className = "",
}: AmazonProcessHistoryDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    historyBatches,
    isLoadingHistory,
    fetchHistoryBatches,
    loadBatchFromHistory,
    activeHistoryBatchId,
  } = useAmazonOrderStore();

  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);

  // Fetch batches when dropdown opens or initially
  useEffect(() => {
    fetchHistoryBatches();
  }, [fetchHistoryBatches]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Handle selecting a historical batch
  const handleSelectBatch = async (batch: AmazonBatchHistoryItem) => {
    try {
      setLoadingBatchId(batch.id);
      setIsOpen(false);
      toast.loading(`Loading batch from ${formatBatchDate(batch.batchDate || batch.createdAt)}...`, {
        id: "load-history-batch",
      });

      const success = await loadBatchFromHistory(batch.id);

      if (success) {
        toast.success(`Loaded batch with ${batch.totalOrders} order(s)!`, {
          id: "load-history-batch",
        });
        // Automatically navigate to the result page with the matched orders table!
        router.push("/dashboard/order-process/amazon/order-process/result");
      } else {
        toast.error("Failed to load historical batch data.", {
          id: "load-history-batch",
        });
      }
    } catch (err) {
      console.error("Error loading batch from history:", err);
      toast.error("Error loading historical batch.", {
        id: "load-history-batch",
      });
    } finally {
      setLoadingBatchId(null);
    }
  };

  // Helper to parse date string without unexpected UTC offset shifts
  const parseBatchDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const cleanStr = typeof dateStr === "string" ? dateStr.replace("Z", "") : dateStr;
    return new Date(cleanStr);
  };

  // Helper to format date cleanly
  const formatBatchDate = (dateStr: string): string => {
    if (!dateStr) return "N/A";
    try {
      const d = parseBatchDate(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;

      return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  // Format expiration notice (6:00 PM on 7th day)
  const formatExpiryNotice = (expiresAtStr?: string): string => {
    if (!expiresAtStr) return "Expires at 6:00 PM on Day 7";
    try {
      const d = parseBatchDate(expiresAtStr);
      return `Expires ${d.toLocaleDateString([], { day: "2-digit", month: "short" })} at 6:00 PM`;
    } catch {
      return "Expires at 6:00 PM on Day 7";
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            fetchHistoryBatches();
          }
        }}
        disabled={loadingBatchId !== null}
        className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
          isOpen
            ? "border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] ring-2 ring-[#E8C16D]/30"
            : "border-slate-200 bg-white text-[#0A0E1A] hover:border-[#E8C16D] hover:bg-slate-50"
        }`}
      >
        <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728]">
          <History className="h-3.5 w-3.5" />
        </div>

        <span>History (Last 7 Days)</span>

        {historyBatches.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-[#0A0E1A] px-2 py-0.5 text-[10px] font-extrabold text-[#E8C16D]">
            {historyBatches.length}
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#B88728]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 z-50 mt-2 w-[340px] sm:w-[420px] max-w-[95vw] origin-top-left rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0A0E1A]">
                  Last 7 Days Batch History
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Data & files expire at 6:00 PM on the 7th day
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchHistoryBatches();
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              title="Refresh 7-day history"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoadingHistory ? "animate-spin text-[#B88728]" : ""}`} />
            </button>
          </div>

          {/* Batches List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 py-2 pr-1">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#E8C16D]" />
                <p className="font-medium">Fetching 7-day processed batches...</p>
              </div>
            ) : historyBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-2">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-[#0A0E1A]">No History in Last 7 Days</p>
                <p className="text-[11px] text-slate-500 max-w-[240px]">
                  Uploaded and processed Amazon batches from the past 7 days will appear here.
                </p>
              </div>
            ) : (
              historyBatches.map((batch) => {
                const isActive = activeHistoryBatchId === batch.id;
                const isItemLoading = loadingBatchId === batch.id;

                return (
                  <div
                    key={batch.id}
                    onClick={() => !isItemLoading && handleSelectBatch(batch)}
                    className={`group relative flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-[#E8C16D] bg-[#FFF9EC]/60 shadow-2xs"
                        : "border-slate-100 bg-slate-50/50 hover:border-[#E8C16D]/60 hover:bg-[#FFF9EC]/30"
                    }`}
                  >
                    {/* Top Row: Date/Time + Match Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-[#0A0E1A] truncate">
                          {formatBatchDate(batch.batchDate || batch.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {batch.matchPercentage >= 100 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                            <CheckCircle2 className="h-3 w-3" />
                            100% Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/70">
                            <AlertTriangle className="h-3 w-3" />
                            {batch.matchPercentage}% Matched
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Metrics & File Names */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#0A0E1A]">
                          {batch.totalOrders} Order{batch.totalOrders !== 1 ? "s" : ""}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-medium">
                          {batch.matchedCount} Matched
                        </span>
                        {batch.mismatchCount > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-red-600 font-medium">
                              {batch.mismatchCount} Mismatch
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {formatExpiryNotice(batch.expiresAt)}
                      </span>
                    </div>

                    {/* Bottom Row: File Name & Action Arrow */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[10px] text-slate-500">
                      <span className="truncate max-w-[240px]" title={batch.pdfFileName || ""}>
                        {batch.pdfFileName || "Amazon Invoices"}
                      </span>

                      <div className="inline-flex items-center gap-1 font-bold text-[#B88728] group-hover:translate-x-0.5 transition-transform">
                        {isItemLoading ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                          </span>
                        ) : (
                          <>
                            <span>View Result</span>
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-2">
            <span>Selecting any date opens its Matched Order Table</span>
            <span className="font-medium text-slate-500">Auto-pruned at 6 PM (Day 7)</span>
          </div>
        </div>
      )}
    </div>
  );
}

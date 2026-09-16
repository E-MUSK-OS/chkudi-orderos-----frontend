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
  Printer,
  Eye,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { useAmazonOrderStore, getPrintedBatchesMap } from "../store/useAmazonOrderStore";
import { amazonOrderService, AmazonBatchHistoryItem } from "../services/amazonOrder.service";

interface AmazonProcessHistoryDropdownProps {
  className?: string;
}

export default function AmazonProcessHistoryDropdown({
  className = "",
}: AmazonProcessHistoryDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [dbPrintedOrders, setDbPrintedOrders] = useState<{ orderId: string; awb: string }[]>([]);

  const {
    historyBatches,
    isLoadingHistory,
    fetchHistoryBatches,
    loadBatchFromHistory,
    activeHistoryBatchId,
  } = useAmazonOrderStore();

  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);

  // Fetch batches and printed orders when dropdown opens or initially
  useEffect(() => {
    fetchHistoryBatches();
    if (isOpen) {
      amazonOrderService
        .getOrders("?limit=1000")
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setDbPrintedOrders(res.data.map((o) => ({ orderId: o.orderId, awb: o.awb })));
          }
        })
        .catch(() => {});
    }
  }, [fetchHistoryBatches, isOpen]);

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

  // Helper to determine printed count and printed orders list for a batch
  const getBatchPrintedInfo = (batch: AmazonBatchHistoryItem) => {
    const map = getPrintedBatchesMap();
    const stored =
      (batch.id ? map[batch.id] : null) ||
      map[`batch_${batch.id}`] ||
      map[`${batch.pdfFileName || ""}_${batch.zplFileName || ""}_${batch.totalOrders}`] ||
      map[`batch_${batch.totalOrders}`];

    let count = batch.summary?.printedCount ?? stored?.count ?? stored?.indices?.length ?? 0;
    const printedOrderNumbers = stored?.orderNumbers || batch.summary?.printedOrderIds || [];
    const printedAwbs = stored?.awbs || batch.summary?.printedAwbs || [];

    // Fallback: cross-reference with dbPrintedOrders if count is 0 and batch has results
    if (count === 0 && dbPrintedOrders.length > 0 && Array.isArray((batch as any).results)) {
      const dbAwbSet = new Set(dbPrintedOrders.map((o) => o.awb).filter(Boolean));
      const matched = (batch as any).results.filter(
        (r: any) => r.awb && r.awb !== "N/A" && r.awb !== "-" && dbAwbSet.has(r.awb)
      );
      if (matched.length > 0) {
        count = matched.length;
      }
    }

    return {
      count,
      printedOrderNumbers,
      printedAwbs,
    };
  };

  // Handle selecting a historical batch (with option to directly show printed orders in table)
  const handleSelectBatch = async (batch: AmazonBatchHistoryItem, showPrintedOnly = false) => {
    try {
      setLoadingBatchId(batch.id);
      setIsOpen(false);
      toast.loading(
        showPrintedOnly
          ? `Opening printed orders table from ${formatBatchDate(batch.batchDate || batch.createdAt)}...`
          : `Loading batch from ${formatBatchDate(batch.batchDate || batch.createdAt)}...`,
        {
          id: "load-history-batch",
        }
      );

      const success = await loadBatchFromHistory(batch.id, { showPrinted: showPrintedOnly });

      if (success) {
        toast.success(
          showPrintedOnly
            ? `Viewing printed orders table for batch from ${formatBatchDate(batch.batchDate || batch.createdAt)}!`
            : `Loaded batch with ${batch.totalOrders} order(s)!`,
          {
            id: "load-history-batch",
          }
        );
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
                const printedInfo = getBatchPrintedInfo(batch);
                const printedCount = printedInfo.count;
                const isExpanded = expandedBatchId === batch.id;

                return (
                  <div
                    key={batch.id}
                    onClick={() => !isItemLoading && handleSelectBatch(batch, false)}
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

                    {/* Middle Row: Metrics & Printed Count Badge */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
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
                        <span className="text-slate-300">•</span>
                        {printedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            {printedCount >= batch.matchedCount ? "All Printed" : `${printedCount} Printed`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px]">0 Printed</span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatExpiryNotice(batch.expiresAt)}
                      </span>
                    </div>

                    {/* Bottom Row: File Name & Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[10px] text-slate-500 gap-2">
                      <span className="truncate max-w-[130px] sm:max-w-[160px]" title={batch.pdfFileName || ""}>
                        {batch.pdfFileName || "Amazon Invoices"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {printedCount > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBatchId((prev) => (prev === batch.id ? null : batch.id));
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition cursor-pointer border ${
                                isExpanded
                                  ? "bg-[#0A0E1A] text-[#E8C16D] border-[#0A0E1A]"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              }`}
                              title="Toggle inline printed orders table preview"
                            >
                              <Table className="h-3 w-3" />
                              <span>{isExpanded ? "Hide Table" : "Table Preview"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isItemLoading) handleSelectBatch(batch, true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 transition cursor-pointer shadow-2xs"
                              title="Open full result page showing only printed orders in table"
                            >
                              <Printer className="h-3 w-3 text-emerald-600" />
                              <span>Show Printed ({printedCount})</span>
                            </button>
                          </>
                        )}

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isItemLoading) handleSelectBatch(batch, false);
                          }}
                          className="inline-flex items-center gap-1 font-bold text-[#B88728] hover:text-[#0A0E1A] transition text-xs cursor-pointer ml-1"
                          title="View full matched orders table"
                        >
                          {isItemLoading ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                            </span>
                          ) : (
                            <>
                              <span>View Table</span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Expandable Printed Orders Table Preview */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-inner"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-600">
                          <span className="uppercase tracking-wider">Printed Orders Table Preview ({printedCount})</span>
                          <button
                            type="button"
                            onClick={() => handleSelectBatch(batch, true)}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            Open In Full Result Page
                          </button>
                        </div>

                        <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 pt-1 text-[11px]">
                          {(printedInfo.printedOrderNumbers.length > 0
                            ? printedInfo.printedOrderNumbers
                            : ["Printed Order"]
                          ).map((ordNum, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 px-1">
                              <span className="font-mono text-slate-800 font-semibold truncate max-w-[140px]">
                                {ordNum}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                                {printedInfo.printedAwbs[idx] || "—"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Printed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

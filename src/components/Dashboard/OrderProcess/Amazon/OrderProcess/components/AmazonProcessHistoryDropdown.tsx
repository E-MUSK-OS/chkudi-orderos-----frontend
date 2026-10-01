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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAmazonOrderStore } from "../store/useAmazonOrderStore";
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

  const {
    historyBatches,
    isLoadingHistory,
    fetchHistoryBatches,
    loadBatchFromHistory,
    activeHistoryBatchId,
  } = useAmazonOrderStore();

  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);

  // Fetch batches when dropdown opens
  useEffect(() => {
    fetchHistoryBatches();
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

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Dynamic responsive panel placement across all viewports
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (viewportWidth < 640) {
        setPanelStyle({
          position: "fixed",
          top: `${rect.bottom + 8}px`,
          left: "12px",
          right: "12px",
          width: "auto",
          maxWidth: "calc(100vw - 24px)",
        });
      } else {
        const panelWidth = Math.min(440, viewportWidth - 32);
        const fitsRight = rect.left + panelWidth <= viewportWidth - 16;

        if (fitsRight) {
          setPanelStyle({
            position: "absolute",
            top: "100%",
            left: 0,
            right: "auto",
            marginTop: "8px",
            width: `${panelWidth}px`,
            maxWidth: "calc(100vw - 32px)",
          });
        } else {
          setPanelStyle({
            position: "absolute",
            top: "100%",
            left: "auto",
            right: 0,
            marginTop: "8px",
            width: `${panelWidth}px`,
            maxWidth: "calc(100vw - 32px)",
          });
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  // Helper to determine printed count and printed orders list for a batch
  // STRICT BATCH-ID ISOLATION: Only shows printed count if the data is keyed to THIS batch's unique ID.
  // Never uses batch.summary.printedCount because the backend cross-contaminates it via global AWB matching.
  const getBatchPrintedInfo = (batch: AmazonBatchHistoryItem) => {
    // 100% reliant on backend now.
    const backendIndices = batch.summary?.printedIndices;
    const hasBackendIndices = Array.isArray(backendIndices) && backendIndices.length > 0;

    let count = 0;
    if (hasBackendIndices) {
      count = backendIndices!.length;
    }

    const printedOrderNumbers = hasBackendIndices ? (batch.summary?.printedOrderIds || []) : [];
    const printedAwbs = hasBackendIndices ? (batch.summary?.printedAwbs || []) : [];

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

  const handleDeleteBatch = async (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch? All printed orders associated with this batch will also be permanently deleted."
    );
    if (!confirmed) return;

    try {
      setLoadingBatchId(batchId);
      toast.loading("Deleting batch and associated orders...", { id: "delete-batch" });
      
      const response = await amazonOrderService.deleteAmazonBatch(batchId);
      
      if (response?.success) {
        toast.success("Batch and associated orders deleted successfully!", { id: "delete-batch" });
        fetchHistoryBatches(); // Refresh history list
      } else {
        toast.error("Failed to delete batch.", { id: "delete-batch" });
      }
    } catch (err) {
      console.error("Error deleting batch:", err);
      toast.error("Error deleting batch.", { id: "delete-batch" });
    } finally {
      if (loadingBatchId === batchId) {
        setLoadingBatchId(null);
      }
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
    <div ref={dropdownRef} className={`relative inline-block text-left shrink-0 ${className}`}>
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
        className={`w-full sm:w-auto inline-flex items-center justify-between gap-1.5 sm:gap-2 rounded-2xl border px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
          isOpen
            ? "border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] ring-2 ring-[#E8C16D]/30"
            : "border-slate-200 bg-white text-[#0A0E1A] hover:border-[#E8C16D] hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0">
            <History className="h-3.5 w-3.5" />
          </div>

          <span className="whitespace-nowrap">
            History <span className="hidden xl:inline">(Last 7 Days)</span><span className="hidden sm:inline xl:hidden">(7 Days)</span><span className="sm:hidden">(7D)</span>
          </span>

          {historyBatches.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-[#0A0E1A] px-1.5 sm:px-2 py-0.5 text-[10px] font-extrabold text-[#E8C16D] shrink-0">
              {historyBatches.length}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#B88728]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          style={panelStyle}
          className="z-50 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-2.5 sm:p-3.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-2 sm:px-3 pb-2.5 pt-1 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#0A0E1A] truncate">
                  Last 7 Days Batch History
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
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
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              title="Refresh 7-day history"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoadingHistory ? "animate-spin text-[#B88728]" : ""}`} />
            </button>
          </div>

          {/* Batches List */}
          <div className="max-h-[55vh] sm:max-h-[400px] overflow-y-auto space-y-2 py-2 pr-1">
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
                    className={`group relative flex flex-col gap-2 rounded-2xl border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-[#E8C16D] bg-[#FFF9EC]/60 shadow-2xs"
                        : "border-slate-100 bg-slate-50/50 hover:border-[#E8C16D]/60 hover:bg-[#FFF9EC]/30"
                    }`}
                  >
                    {/* Top Row: Date/Time + Match Badge + Delete */}
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-[#0A0E1A] truncate">
                          {formatBatchDate(batch.batchDate || batch.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {batch.matchPercentage >= 100 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 border border-emerald-200/70 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3" />
                            100% Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-700 border border-amber-200/70 whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3" />
                            {batch.matchPercentage}% Matched
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteBatch(batch.id, e)}
                          disabled={isItemLoading}
                          className="grid h-7 w-7 sm:h-6 sm:w-6 place-items-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition ml-0.5"
                          title="Delete this batch and its associated orders"
                        >
                          {isItemLoading && loadingBatchId === batch.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Metrics & Printed Count Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600 pt-0.5">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
                        <span className="font-semibold text-[#0A0E1A] whitespace-nowrap">
                          {batch.totalOrders} Order{batch.totalOrders !== 1 ? "s" : ""}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-medium whitespace-nowrap">
                          {batch.matchedCount} Matched
                        </span>
                        {batch.mismatchCount > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-red-600 font-medium whitespace-nowrap">
                              {batch.mismatchCount} Mismatch
                            </span>
                          </>
                        )}
                        <span className="text-slate-300">•</span>
                        {printedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-200/60 whitespace-nowrap text-[10px]">
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            {printedCount >= batch.matchedCount ? "All Printed" : `${printedCount} Printed`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px] whitespace-nowrap">0 Printed</span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatExpiryNotice(batch.expiresAt)}
                      </span>
                    </div>

                    {/* Bottom Row: File Name & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-100/80 text-[10px] text-slate-500 gap-1.5">
                      <span className="truncate max-w-[140px] sm:max-w-[180px] font-medium text-slate-600" title={batch.pdfFileName || ""}>
                        {batch.pdfFileName || "Amazon Invoices"}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5 justify-end ml-auto">
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
                              <span>{isExpanded ? "Hide" : "Preview"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isItemLoading) handleSelectBatch(batch, true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 transition cursor-pointer shadow-2xs whitespace-nowrap"
                              title="View printed orders only"
                            >
                              <Printer className="h-3 w-3 text-emerald-600" />
                              <span>Printed ({printedCount})</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isItemLoading) handleSelectBatch(batch, false);
                          }}
                          className="inline-flex items-center gap-1 font-bold text-[#B88728] hover:text-[#0A0E1A] transition text-[11px] sm:text-xs cursor-pointer ml-auto sm:ml-1 py-0.5"
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
                        </button>
                      </div>
                    </div>

                    {/* Inline Expandable Printed Orders Table Preview */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-inner"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100 gap-1 text-[10px] font-bold text-slate-600">
                          <span className="uppercase tracking-wider">Printed Orders ({printedCount})</span>
                          <button
                            type="button"
                            onClick={() => handleSelectBatch(batch, true)}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer self-start sm:self-auto"
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
                            <div key={idx} className="flex items-center justify-between py-1 px-1 gap-2">
                              <span className="font-mono text-slate-800 font-semibold truncate flex-1 min-w-0">
                                {ordNum}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[90px] sm:max-w-[130px]">
                                {printedInfo.printedAwbs[idx] || "—"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 shrink-0">
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
          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[9px] sm:text-[10px] text-slate-400 px-1 sm:px-2">
            <span>Selecting opens Matched Order Table</span>
            <span className="font-medium text-slate-500">Expires 6 PM (Day 7)</span>
          </div>
        </div>
      )}
    </div>
  );
}

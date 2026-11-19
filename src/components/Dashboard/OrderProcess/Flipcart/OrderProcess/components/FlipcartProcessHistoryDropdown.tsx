"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  History,
  Clock,
  Calendar,
  ChevronDown,
  CheckCircle2,
  RotateCw,
  Loader2,
  ArrowRight,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useFlipcartOrderStore } from "../store/useFlipcartOrderStore";
import {
  flipcartOrderService,
  FlipcartBatchHistoryItem,
} from "../services/flipcartOrder.service";
import { usePagePermissions } from "@/utils/pagePermissions";
import DeleteBatchConfirmModal, {
  DeleteBatchInfo,
} from "@/components/Dashboard/OrderProcess/common/DeleteBatchConfirmModal";

interface FlipcartProcessHistoryDropdownProps {
  className?: string;
}

export default function FlipcartProcessHistoryDropdown({
  className = "",
}: FlipcartProcessHistoryDropdownProps) {
  const router = useRouter();
  const { canDelete } = usePagePermissions("order-process/flipkart/order-process");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    historyBatches,
    isLoadingHistory,
    fetchHistoryBatches,
    loadBatchFromHistory,
    activeHistoryBatchId,
  } = useFlipcartOrderStore();

  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<DeleteBatchInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile viewport and mounted state
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch batches on initial mount so the batch count is loaded by default
  useEffect(() => {
    fetchHistoryBatches();
  }, [fetchHistoryBatches]);

  // Re-fetch batches when dropdown opens to guarantee live fresh data
  useEffect(() => {
    if (isOpen) {
      fetchHistoryBatches();
    }
  }, [fetchHistoryBatches, isOpen]);

  // Close dropdown on outside click (inhibited on mobile and when delete confirmation modal is open)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (batchToDelete) return;
      if (isMobile) return; // Mobile uses backdrop overlay
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
  }, [isOpen, batchToDelete, isMobile]);

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Dynamic responsive panel placement for desktop
  useEffect(() => {
    if (!isOpen || !dropdownRef.current || isMobile) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = Math.min(440, viewportWidth - 24);

      // Align to right edge (right: 0) when trigger is on the right half or has enough space to the left.
      // This prevents ANY right-side overflow or cutting off of buttons/shadows.
      const shouldAlignRight = rect.right >= panelWidth + 16 || rect.left > viewportWidth / 2;

      setPanelStyle({
        position: "absolute",
        top: "100%",
        right: shouldAlignRight ? 0 : "auto",
        left: shouldAlignRight ? "auto" : 0,
        marginTop: "8px",
        width: `${panelWidth}px`,
        maxWidth: "calc(100vw - 24px)",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, isMobile]);

  const getBatchPrintedInfo = (batch: FlipcartBatchHistoryItem) => {
    const backendIndices = batch.summary?.printedIndices;
    const hasBackendIndices =
      Array.isArray(backendIndices) && backendIndices.length > 0;

    let count = 0;
    if (hasBackendIndices) {
      count = backendIndices.length;
    } else if (typeof (batch.summary as any)?.printedCount === "number") {
      count = (batch.summary as any).printedCount;
    }

    const printedOrderNumbers = hasBackendIndices
      ? batch.summary?.printedOrderIds || []
      : [];
    const printedAwbs = hasBackendIndices
      ? batch.summary?.printedAwbs || []
      : [];

    return {
      count,
      printedOrderNumbers,
      printedAwbs,
    };
  };

  const handleSelectBatch = async (
    batch: FlipcartBatchHistoryItem,
    showPrintedOnly = false
  ) => {
    try {
      setLoadingBatchId(batch.id);
      setIsOpen(false);
      toast.loading(
        showPrintedOnly
          ? `Opening printed orders table from ${formatBatchDate(
              batch.batchDate || batch.createdAt
            )}...`
          : `Loading batch from ${formatBatchDate(
              batch.batchDate || batch.createdAt
            )}...`,
        {
          id: "load-flipcart-history-batch",
        }
      );

      const success = await loadBatchFromHistory(batch.id, {
        showPrinted: showPrintedOnly,
      });

      if (success) {
        toast.success(
          showPrintedOnly
            ? `Viewing printed orders table for batch from ${formatBatchDate(
                batch.batchDate || batch.createdAt
              )}!`
            : `Loaded batch with ${batch.totalOrders} order(s)!`,
          {
            id: "load-flipcart-history-batch",
          }
        );
        router.push("/dashboard/order-process/flipcart/order-process/result");
      } else {
        toast.error("Failed to load historical batch data.", {
          id: "load-flipcart-history-batch",
        });
      }
    } catch (err) {
      console.error("Error loading batch from history:", err);
      toast.error("Error loading historical batch.", {
        id: "load-flipcart-history-batch",
      });
    } finally {
      setLoadingBatchId(null);
    }
  };

  const handlePromptDeleteBatch = (
    batch: FlipcartBatchHistoryItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!canDelete) {
      toast.error("Access denied. You do not have permission to delete batches.");
      return;
    }
    const printedInfo = getBatchPrintedInfo(batch);
    setBatchToDelete({
      id: batch.id,
      formattedDate: formatBatchDate(batch.batchDate || batch.createdAt),
      totalOrders: batch.totalOrders,
      printedCount: printedInfo.count,
      fileName: batch.pdfFileName || "Flipkart Batch PDF",
      platform: "flipcart",
    });
  };

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    try {
      setIsDeleting(true);
      setLoadingBatchId(batchToDelete.id);
      toast.loading("Deleting batch and associated orders...", {
        id: "delete-flipcart-batch",
      });

      const response = await flipcartOrderService.deleteFlipcartBatch(
        batchToDelete.id
      );

      if (response?.success) {
        toast.success("Batch and associated orders deleted successfully!", {
          id: "delete-flipcart-batch",
        });
        fetchHistoryBatches();
        setBatchToDelete(null);
      } else {
        toast.error("Failed to delete batch.", { id: "delete-flipcart-batch" });
      }
    } catch (err) {
      console.error("Error deleting batch:", err);
      toast.error("Error deleting batch.", { id: "delete-flipcart-batch" });
    } finally {
      setIsDeleting(false);
      setLoadingBatchId(null);
    }
  };

  const parseBatchDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const cleanStr =
      typeof dateStr === "string" ? dateStr.replace("Z", "") : dateStr;
    return new Date(cleanStr);
  };

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

      const timeStr = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;

      return `${d.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      })}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const formatExpiryNotice = (expiresAtStr?: string): string => {
    if (!expiresAtStr) return "Expires at 6:00 PM on Day 7";
    try {
      const d = parseBatchDate(expiresAtStr);
      return `Expires ${d.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      })} at 6:00 PM`;
    } catch {
      return "Expires at 6:00 PM on Day 7";
    }
  };

  // Shared Batch List Renderer used in both Desktop Dropdown and Mobile Modal
  const renderBatchList = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-slate-500 dark:text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#E8C16D]" />
          <p className="font-medium text-[11px]">Fetching 7-day processed batches...</p>
        </div>
      );
    }

    if (historyBatches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-3 text-center space-y-1.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 dark:bg-white/[0.04] text-slate-400 border border-slate-100 dark:border-white/[0.08]">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-[#0A0E1A] dark:text-white">
            No History in Last 7 Days
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[220px]">
            Uploaded and processed Flipkart batches from the past 7 days will appear here.
          </p>
        </div>
      );
    }

    return historyBatches.map((batch) => {
      const isActive = activeHistoryBatchId === batch.id;
      const isItemLoading = loadingBatchId === batch.id;
      const printedInfo = getBatchPrintedInfo(batch);
      const printedCount = printedInfo.count;

      return (
        <div
          key={batch.id}
          onClick={() => !isItemLoading && handleSelectBatch(batch, false)}
          className={`group relative flex flex-col gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border p-2 sm:p-2.5 text-left transition-all cursor-pointer ${
            isActive
              ? "border-[#E8C16D] bg-[#FFF9EC]/60 dark:bg-[#1A160E]/80 shadow-2xs"
              : "border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] hover:border-[#E8C16D]/60 hover:bg-[#FFF9EC]/30 dark:hover:bg-[#1A160E]/40"
          }`}
        >
          {/* Top Row: Date/Time + Status Badge + Delete */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-[#0A0E1A] dark:text-white truncate">
                {formatBatchDate(batch.batchDate || batch.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40 whitespace-nowrap">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Ready
              </span>

              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => handlePromptDeleteBatch(batch, e)}
                  disabled={isItemLoading}
                  className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition ml-0.5 cursor-pointer"
                  title="Delete this batch and its associated orders"
                >
                  {isItemLoading && loadingBatchId === batch.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Middle Row: Metrics & Printed Count Badge */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="font-semibold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                {batch.totalOrders} Order{batch.totalOrders !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              {printedCount > 0 ? (
                <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40 whitespace-nowrap text-[9px]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400" />
                  {printedCount >= batch.totalOrders
                    ? "All Printed"
                    : `${printedCount} Printed`}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px] whitespace-nowrap">
                  0 Printed
                </span>
              )}
            </div>

            <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0">
              {formatExpiryNotice(batch.expiresAt)}
            </span>
          </div>

          {/* Bottom Row: File Name & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-100/80 dark:border-white/[0.06] text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 gap-1">
            <span
              className="truncate max-w-[140px] sm:max-w-[240px] font-medium text-slate-600 dark:text-slate-300 text-[9px] sm:text-[10px]"
              title={batch.pdfFileName || ""}
            >
              {batch.pdfFileName || "Flipkart Invoices"}
            </span>

            <div className="flex flex-wrap items-center gap-1 justify-end ml-auto">
              {printedCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isItemLoading) handleSelectBatch(batch, true);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 transition cursor-pointer shadow-2xs whitespace-nowrap"
                  title="View printed orders only"
                >
                  <Printer className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Printed ({printedCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isItemLoading) handleSelectBatch(batch, false);
                }}
                className="inline-flex items-center gap-0.5 font-bold text-[#B88728] dark:text-[#E8C16D] hover:text-[#0A0E1A] dark:hover:text-white transition text-[10px] sm:text-[11px] cursor-pointer ml-auto sm:ml-0.5 py-0.5"
                title="View full orders table"
              >
                {isItemLoading ? (
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading...
                  </span>
                ) : (
                  <>
                    <span>View Table</span>
                    <ArrowRight className="h-2.5 w-2.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left shrink-0 ${className}`}
    >
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
        className={`w-full sm:w-auto inline-flex items-center justify-between gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
          isOpen
            ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] ring-2 ring-[#E8C16D]/30"
            : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0">
            <History className="h-3.5 w-3.5" />
          </div>

          <span className="whitespace-nowrap">
            History{" "}
            <span className="hidden xl:inline">(Last 7 Days)</span>
            <span className="hidden sm:inline xl:hidden">(7 Days)</span>
            <span className="sm:hidden">(7D)</span>
          </span>

          {historyBatches.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-[#0A0E1A] dark:bg-[#E8C16D]/20 px-1.5 sm:px-2 py-0.5 text-[10px] font-extrabold text-[#E8C16D] shrink-0">
              {historyBatches.length}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#B88728] dark:text-[#E8C16D]" : ""
          }`}
        />
      </button>

      {/* DESKTOP VIEW (>= 640px): Floating Anchored Dropdown Menu */}
      {isOpen && !isMobile && (
        <div
          style={panelStyle}
          className="z-50 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-2 sm:p-3 shadow-2xl ring-1 ring-black/5 dark:ring-white/[0.05] animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] px-2 sm:px-2.5 pb-2 pt-0.5 gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate">
                  Last 7 Days Batch History
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
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
              className="grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Refresh 7-day history"
            >
              <RotateCw
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                  isLoadingHistory
                    ? "animate-spin text-[#B88728] dark:text-[#E8C16D]"
                    : ""
                }`}
              />
            </button>
          </div>

          {/* Batches List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 py-1.5 pr-1 max-h-[350px]">
            {renderBatchList()}
          </div>

          {/* Footer Note */}
          <div className="mt-0.5 pt-1.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-1 text-[9px] text-slate-400 dark:text-slate-500 px-1 sm:px-2">
            <span>Selecting opens Order Table</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Expires 6 PM (Day 7)
            </span>
          </div>
        </div>
      )}

      {/* MOBILE VIEW (< 640px): Centered Popup Modal with Blurred Backdrop */}
      {isOpen && isMobile && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-3 sm:px-5 py-4">
          {/* Blurred Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered Modal Card (Full Width matching Main Page side padding & compact height) */}
          <div className="relative z-10 w-full max-w-lg sm:max-w-xl max-h-[58vh] sm:max-h-[62vh] rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Title & Close Button */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] px-3.5 sm:px-4 py-2.5 gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate">
                    Last 7 Days Batch History
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Data & files expire at 6:00 PM on 7th day
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchHistoryBatches();
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Refresh 7-day history"
                >
                  <RotateCw
                    className={`h-3.5 w-3.5 ${
                      isLoadingHistory
                        ? "animate-spin text-[#B88728] dark:text-[#E8C16D]"
                        : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                  title="Close history modal"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Batches List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 space-y-1.5 min-h-0">
              {renderBatchList()}
            </div>

            {/* Footer */}
            <div className="px-3.5 sm:px-4 py-1.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#080B11] flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 shrink-0">
              <span>Selecting opens Order Table</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Expires 6 PM (Day 7)
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Batch Confirmation Modal matching OrderOS Theme */}
      <DeleteBatchConfirmModal
        isOpen={Boolean(batchToDelete)}
        onClose={() => !isDeleting && setBatchToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        batchInfo={batchToDelete}
      />
    </div>
  );
}

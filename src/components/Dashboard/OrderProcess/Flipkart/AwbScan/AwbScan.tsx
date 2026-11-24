"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
import AwbScanner from "./components/AwbScanner";
import AwbMissingTable from "./components/AwbMissingTable";
import AwbScanSummary from "./components/AwbScanSummary";
import AwbToolbar from "./components/AwbToolbar";
import AwbTable from "./components/AwbTable";
import { useAwbScanner } from "./hooks/useAwbScanner";
import {
  flipkartOrderService,
  FlipkartAwbOrderItem,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/services/flipkartOrder.service";
import { getTodayDateStringIST } from "./timeUtils";
import { socket } from "@/lib/socket";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function FlipkartAwbScan() {
  const [orders, setOrders] = useState<FlipkartAwbOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SCANNED">("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStringIST);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    pending: 0,
    scanned: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const missingTableContainerRef = useRef<HTMLDivElement>(null);
  const fixedSectionRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  // Coordinated stop-scrolling handler:
  // 1. When scrolling down, outer page scrolls until Header & Summary are hidden and stops at the fixed position (Img 2).
  // 2. Once at the fixed position, Missing Table and Main Table scroll internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals Summary & Header.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      const path = e.composedPath();
      const missingTable = missingTableContainerRef.current;
      const isOverMissingTable =
        missingTable &&
        (path.includes(missingTable) || missingTable.contains(e.target as Node));
      const activeTable = isOverMissingTable && missingTable ? missingTable : tableContainerRef.current;

      coordinateTableWheelScroll({
        e,
        scrollContainer,
        tableContainer: activeTable,
      });
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Fetch orders from backend
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("packingScanStatus", statusFilter);
      if (selectedDate) params.set("date", selectedDate);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await flipkartOrderService.getOrders(`?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        setTotal(res.total);
        if (res.summary) {
          setSummaryCounts(res.summary);
        } else {
          const pending = res.data.filter((i) => i.packingScanStatus === "PENDING").length;
          const scanned = res.data.filter((i) => i.packingScanStatus === "SCANNED").length;
          setSummaryCounts({ total: res.total, pending, scanned });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Flipkart orders:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [search, statusFilter, selectedDate, page, limit]);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Auto-refresh orders whenever the user switches back to the AWB Scan tab
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchOrders(true);
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [fetchOrders]);

  // Debounced silent fetch for rapid sequential prints/scans
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedFetchOrders = useCallback(() => {
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }
    fetchTimerRef.current = setTimeout(() => {
      fetchOrders(true);
    }, 250);
  }, [fetchOrders]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (typeof window === "undefined" || !socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const emitJoin = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            socket.emit("join:user", user.id);
            console.log(`👤 Flipkart AwbScan joined socket room user:${user.id}`);
          }
        } catch (error) {
          console.error("Failed to parse user for socket in Flipkart AwbScan:", error);
        }
      }
    };

    emitJoin();
    socket.on("connect", emitJoin);

    const handleOrderPrinted = (data: {
      userId?: string;
      batchId?: string;
      count?: number;
      awbs?: string[];
      orders?: FlipkartAwbOrderItem[];
    }) => {
      console.log("⚡ [Socket] flipkartOrderPrinted received on AwbScan:", data);

      const userData = localStorage.getItem("user");
      let currentUserId: string | null = null;
      if (userData) {
        try {
          currentUserId = JSON.parse(userData)?.id || null;
        } catch { }
      }

      if (data.userId && currentUserId && data.userId !== currentUserId) {
        return;
      }

      debouncedFetchOrders();

      const count = data.count || data.awbs?.length || 1;
      toast.success(`⚡ Real-time update: ${count} newly printed Flipkart order(s) added!`, {
        id: "socket-flipkart-order-printed",
        duration: 4000,
      });
    };

    const handleOrderStatusUpdated = (data: {
      userId?: string;
      id: string;
      awb: string;
      packingScanStatus: "PENDING" | "SCANNED";
      order?: FlipkartAwbOrderItem;
    }) => {
      console.log("⚡ [Socket] flipkartOrderStatusUpdated received on AwbScan:", data);

      const userData = localStorage.getItem("user");
      let currentUserId: string | null = null;
      if (userData) {
        try {
          currentUserId = JSON.parse(userData)?.id || null;
        } catch { }
      }

      if (data.userId && currentUserId && data.userId !== currentUserId) {
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === data.id || item.awb === data.awb
            ? { ...item, packingScanStatus: data.packingScanStatus }
            : item
        )
      );

      debouncedFetchOrders();
    };

    const handleBatchDeleted = (data: { userId?: string; batchId?: string }) => {
      console.log("⚡ [Socket] flipkartBatchDeleted received on AwbScan:", data);
      debouncedFetchOrders();
    };

    socket.on("flipkartOrderPrinted", handleOrderPrinted);
    socket.on("flipkartOrderStatusUpdated", handleOrderStatusUpdated);
    socket.on("flipkartBatchDeleted", handleBatchDeleted);

    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
      socket.off("connect", emitJoin);
      socket.off("flipkartOrderPrinted", handleOrderPrinted);
      socket.off("flipkartOrderStatusUpdated", handleOrderStatusUpdated);
      socket.off("flipkartBatchDeleted", handleBatchDeleted);
    };
  }, [debouncedFetchOrders]);

  // Hook for barcode scanning & audio playback
  const {
    scanValue,
    setScanValue,
    message,
    isScanning,
    handleScan,
    missingList,
    removeMissingItem,
    clearMissingList,
  } = useAwbScanner(
    orders,
    setOrders,
    () => {
      setSummaryCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        scanned: prev.scanned + 1,
      }));
      fetchOrders(true);
    }
  );

  const handleExport = async () => {
    try {
      toast.loading("Preparing Excel export...", { id: "export-toast" });
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("packingScanStatus", statusFilter);
      if (selectedDate) params.set("date", selectedDate);
      params.set("page", "1");
      params.set("limit", String(summaryCounts.total || 10000));

      const res = await flipkartOrderService.getOrders(`?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        if (res.data.length === 0) {
          toast.error("No data available to export.", { id: "export-toast" });
          return;
        }

        const exportData = res.data.map((order, idx) => ({
          "NO.": idx + 1,
          "Flipkart Order ID": order.orderId,
          "AWB Tracking": order.awb,
          "FSN Code": order.fsn,
          SKU: order.sku,
          Quantity: order.totalQuantity ?? 1,
          Customer: order.customer,
          "Packing Scan Status": order.packingScanStatus,
          Time: new Date(order.createdAt).toLocaleString("en-IN"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Flipkart_AWB_Scans");
        XLSX.writeFile(workbook, `Flipkart_AWB_Scans_${selectedDate || "All"}.xlsx`);

        toast.success("Export downloaded successfully!", { id: "export-toast" });
      } else {
        toast.error("Failed to fetch data for export.", { id: "export-toast" });
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("An error occurred during export.", { id: "export-toast" });
    }
  };

  return (
    <DashboardLayout title="Flipkart AWB Scan">
      <div ref={containerRef} className="flex flex-col gap-6 w-full max-w-full min-w-0">
        {/* Page Header */}
        <div className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Flipkart AWB Scan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Verify packed Flipkart orders in real-time by scanning AWB tracking numbers (Retained for 7 days).
              </p>
            </div>
            <a
              href="/dashboard/order-process/flipkart/order-process"
              className="inline-flex items-center gap-2 self-start md:self-center rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#131926] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#F5C451] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              ← Back to Order Process
            </a>
          </div>
        </div>

        {/* Toolbar: Search, Status Filter, Date, Refresh */}
        <div className="shrink-0">
          <AwbToolbar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => {
              setStatusFilter(status);
              setPage(1);
            }}
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              setPage(1);
            }}
            onRefresh={() => fetchOrders(false)}
            onExport={handleExport}
            isLoading={isLoading}
            counts={summaryCounts}
          />
        </div>

        {/* Stats Summary Cards (Scrolls away with header when scrolling down) */}
        <div className="shrink-0">
          <AwbScanSummary
            total={summaryCounts.total}
            pending={summaryCounts.pending}
            scanned={summaryCounts.scanned}
            missing={missingList.length}
          />
        </div>

        {/* Lower Fixed Section (Barcode Scanner + Missing Table + Main Table - Exactly like Img 2) */}
        <div
          ref={fixedSectionRef}
          className="flex flex-col gap-3 sm:gap-4 lg:min-h-0"
          style={{
            height: isDesktop && targetHeight ? `${Math.max(targetHeight, missingList.length > 0 ? 640 : 480)}px` : undefined,
            minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
        >
          {/* Barcode Scanner Input */}
          <div className="shrink-0">
            <AwbScanner
              value={scanValue}
              onChange={setScanValue}
              onScan={() => handleScan()}
              onCameraScan={(code) => handleScan(code)}
              isScanning={isScanning}
              message={message}
            />
          </div>

          {/* Missing / Unmatched AWB Scans Table (Internally scrollable) */}
          {missingList.length > 0 && (
            <div className="shrink-0">
              <AwbMissingTable
                missingList={missingList}
                onRemoveItem={removeMissingItem}
                onClearAll={clearMissingList}
                tableContainerRef={missingTableContainerRef}
              />
            </div>
          )}

          {/* Orders Data Table (Internally scrollable) */}
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-full min-w-0">
            <AwbTable
              orders={orders}
              isLoading={isLoading}
              total={total}
              page={page}
              limit={limit}
              tableContainerRef={tableContainerRef}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

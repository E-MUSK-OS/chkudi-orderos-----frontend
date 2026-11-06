"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import AwbScanner from "./components/AwbScanner";
import AwbMissingTable from "./components/AwbMissingTable";
import AwbScanSummary from "./components/AwbScanSummary";
import AwbToolbar from "./components/AwbToolbar";
import AwbTable from "./components/AwbTable";
import { useAwbScanner } from "./hooks/useAwbScanner";
import { amazonOrderService, AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";
import { getTodayDateStringIST } from "./timeUtils";
import { socket } from "@/lib/socket";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function AwbScan() {
  const [orders, setOrders] = useState<AmazonOrderItem[]>([]);
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

      const res = await amazonOrderService.getOrders(`?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        setTotal(res.total);
        if (res.summary) {
          setSummaryCounts(res.summary);
        } else {
          // Fallback calculation
          const pending = res.data.filter((i) => i.packingScanStatus === "PENDING").length;
          const scanned = res.data.filter((i) => i.packingScanStatus === "SCANNED").length;
          setSummaryCounts({ total: res.total, pending, scanned });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Amazon orders:", err);
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

  // Real-time Socket.IO synchronization: auto-update table and stats as soon as orders are printed or scanned
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
            console.log(`👤 AwbScan joined socket room user:${user.id}`);
          }
        } catch (error) {
          console.error("Failed to parse user for socket in AwbScan:", error);
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
      orders?: AmazonOrderItem[];
    }) => {
      console.log("⚡ [Socket] amazonOrderPrinted received on AwbScan:", data);

      const userData = localStorage.getItem("user");
      let currentUserId: string | null = null;
      if (userData) {
        try {
          currentUserId = JSON.parse(userData)?.id || null;
        } catch {}
      }

      if (data.userId && currentUserId && data.userId !== currentUserId) {
        return;
      }

      // Immediately trigger debounced silent refresh
      debouncedFetchOrders();

      const count = data.count || data.awbs?.length || 1;
      toast.success(`⚡ Real-time update: ${count} newly printed order(s) added!`, {
        id: "socket-order-printed",
        duration: 4000,
      });
    };

    const handleOrderStatusUpdated = (data: {
      userId?: string;
      id: string;
      awb: string;
      packingScanStatus: "PENDING" | "SCANNED";
      order?: AmazonOrderItem;
    }) => {
      console.log("⚡ [Socket] amazonOrderStatusUpdated received on AwbScan:", data);

      const userData = localStorage.getItem("user");
      let currentUserId: string | null = null;
      if (userData) {
        try {
          currentUserId = JSON.parse(userData)?.id || null;
        } catch {}
      }

      if (data.userId && currentUserId && data.userId !== currentUserId) {
        return;
      }

      // Optimistically update status if present in current page orders
      setOrders((prev) =>
        prev.map((item) =>
          item.id === data.id || item.awb === data.awb
            ? { ...item, packingScanStatus: data.packingScanStatus }
            : item
        )
      );

      // Debounced refresh to keep summary counts in sync
      debouncedFetchOrders();
    };

    const handleBatchDeleted = (data: { userId?: string; batchId?: string }) => {
      console.log("⚡ [Socket] amazonBatchDeleted received on AwbScan:", data);
      debouncedFetchOrders();
    };

    socket.on("amazonOrderPrinted", handleOrderPrinted);
    socket.on("amazonOrderStatusUpdated", handleOrderStatusUpdated);
    socket.on("amazonBatchDeleted", handleBatchDeleted);

    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
      socket.off("connect", emitJoin);
      socket.off("amazonOrderPrinted", handleOrderPrinted);
      socket.off("amazonOrderStatusUpdated", handleOrderStatusUpdated);
      socket.off("amazonBatchDeleted", handleBatchDeleted);
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
      // Optimistic summary counts update
      setSummaryCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        scanned: prev.scanned + 1,
      }));
      // Silent background sync without table freeze or spinner
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
      // Fetch all matching records for the export
      params.set("page", "1");
      params.set("limit", String(summaryCounts.total || 10000));

      const res = await amazonOrderService.getOrders(`?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        if (res.data.length === 0) {
          toast.error("No data available to export.", { id: "export-toast" });
          return;
        }

        const exportData = res.data.map((order) => ({
          Invoices: order.invoice,
          "Amazon Order ID": order.orderId,
          "AWB Tracking": order.awb,
          ASIN: order.asin,
          "Seller SKU": order.sellerSku,
          Customer: order.customer,
          "Packing Scan Status": order.packingScanStatus,
          Time: new Date(order.createdAt).toLocaleString("en-IN"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AWB_Scans");
        XLSX.writeFile(workbook, `Amazon_AWB_Scans_${selectedDate || "All"}.xlsx`);
        
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
    <DashboardLayout title="Amazon AWB Scan">
      <div className="space-y-6">
        {/* Page Header matching Product Analytics Amazon */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Amazon AWB Scan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Verify packed Amazon orders in real-time by scanning AWB tracking numbers (Retained for 7 days).
              </p>
            </div>
            <a
              href="/dashboard/order-process/amazon/order-process"
              className="inline-flex items-center gap-2 self-start md:self-center rounded-2xl border border-[#0A0E1A] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#131926] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#E8C16D] dark:text-[#F5C451] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              ← Back to Order Process
            </a>
          </div>
        </div>

        {/* Toolbar: Search, Status Filter, Date, Refresh */}
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

        {/* Stats Summary Cards */}
        <AwbScanSummary
          total={summaryCounts.total}
          pending={summaryCounts.pending}
          scanned={summaryCounts.scanned}
          missing={missingList.length}
        />

        {/* Barcode Scanner Input */}
        <AwbScanner
          value={scanValue}
          onChange={setScanValue}
          onScan={() => handleScan()}
          onCameraScan={(code) => handleScan(code)}
          isScanning={isScanning}
          message={message}
        />

        {/* Missing / Unmatched AWB Scans Table */}
        <AwbMissingTable
          missingList={missingList}
          onRemoveItem={removeMissingItem}
          onClearAll={clearMissingList}
        />

        {/* Orders Data Table */}
        <AwbTable
          orders={orders}
          isLoading={isLoading}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

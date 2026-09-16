"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import AwbScanner from "./components/AwbScanner";
import AwbMissingTable from "./components/AwbMissingTable";
import AwbScanSummary from "./components/AwbScanSummary";
import AwbToolbar from "./components/AwbToolbar";
import AwbTable from "./components/AwbTable";
import { useAwbScanner } from "./hooks/useAwbScanner";
import { amazonOrderService, AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";
import { getTodayDateStringIST } from "./timeUtils";

export default function AwbScan() {
  const [orders, setOrders] = useState<AmazonOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "SCANNED">("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStringIST);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
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

  return (
    <DashboardLayout title="Amazon AWB Scan">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Amazon AWB Scan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Verify packed Amazon orders in real-time by scanning AWB tracking numbers. Records are retained for 7 days.
            </p>
          </div>
          <a
            href="/dashboard/order-process/amazon/order-process"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-lg border border-[#0A0E1A] bg-[#0A0E1A] text-xs sm:text-sm font-bold text-[#E8C16D] shadow-sm hover:bg-[#E8C16D] hover:text-[#0A0E1A] transition"
          >
            ← Back to Order Process
          </a>
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

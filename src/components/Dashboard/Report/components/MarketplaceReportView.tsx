"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  AmazonReportAnalytics,
  ReportAccountOption,
  ReportMarketplace,
  reportService,
} from "../services/report.service";

const STATUS_OPTIONS: ThemeSelectOption[] = [
  { value: "All", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "SCANNED", label: "Scanned" },
  { value: "PACKED", label: "Packed" },
];

const RANGE_PRESETS: ThemeSelectOption[] = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const LIMIT_OPTIONS: ThemeSelectOption[] = [
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

const CHART_COLORS = [
  "#E8C16D", // OrderOS Gold
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F97316", // Orange
  "#8B5CF6", // Violet
];

function parseFilterDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

function fmtDate(val?: string | Date | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return format(d, "dd-MM-yyyy");
}

function StatusBadge({ value }: { value: string }) {
  const v = String(value || "").toUpperCase();
  if (v === "SCANNED" || v === "PACKED" || v === "VIDEO LINKED" || v === "MAPPED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        {value}
      </span>
    );
  }
  if (v === "PENDING" || v === "MISSING" || v === "UNMAPPED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        {value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1]">
      {value || "—"}
    </span>
  );
}

export default function MarketplaceReportView({
  marketplace,
}: {
  marketplace: ReportMarketplace;
}) {
  // "analytics" (4 charts + KPIs), "skuTable" (SKU Performance table), "dispatch" (Order & Dispatch table)
  const [viewTab, setViewTab] = useState<"analytics" | "skuTable" | "dispatch">("analytics");
  const [rangePreset, setRangePreset] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<ReportAccountOption[]>([]);
  const [kpis, setKpis] = useState<Record<string, string | number>>({});
  const [analytics, setAnalytics] = useState<AmazonReportAnalytics | undefined>(undefined);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);

  const apiTab = viewTab === "dispatch" ? "dispatch" : "sku";

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getReport(marketplace, {
        tab: apiTab,
        search,
        status: status || "All",
        accountId: accountId || "All",
        startDate,
        endDate,
        page,
        limit,
      });
      setAccounts(data.accounts || []);
      setKpis(data.kpis || {});
      setAnalytics(data.analytics);
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load Amazon Report");
    } finally {
      setLoading(false);
    }
  }, [marketplace, apiTab, search, status, accountId, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const accountOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "All", label: "All" },
      ...accounts.map((a) => ({
        value: a.id,
        label: a.displayName || a.sellerName,
      })),
    ],
    [accounts]
  );

  const handlePresetChange = (val: string) => {
    setRangePreset(val);
    if (val === "all") {
      setStartDate("");
      setEndDate("");
    } else {
      const days = Number(val) || 30;
      const today = new Date();
      setStartDate(format(subDays(today, days), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    }
    setPage(1);
  };

  const handleReset = () => {
    setRangePreset("all");
    setSearch("");
    setStatus("");
    setAccountId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportCsv = () => {
    if (rows.length === 0) {
      toast.error("No rows to export.");
      return;
    }
    const headers = Object.keys(rows[0]).filter((k) => k !== "id" && k !== "videoUrl" && k !== "imageUrl");
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazon-${apiTab}-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported to CSV.");
  };

  const totalOrders = Number(kpis.totalOrders || 0);
  const scannedOrders = Number(kpis.scannedOrders || 0);
  const uniqueCustomers = Number(kpis.uniqueCustomers || 0);
  const topSkuOrders = Number(kpis.topSkuOrders || 0);
  const topSku = String(kpis.topSku || "—");
  const scanPct = totalOrders > 0 ? Math.round((scannedOrders / totalOrders) * 100) : 0;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(total, page * limit);

  return (
    <DashboardLayout title="Amazon Report">
      <div className="w-full space-y-4">
        {/* Top Header Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                    Top performing SKUs
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    Amazon Report
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  SKU order rankings, category share, top 5 daily trend &amp; rank movers
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* View Mode Switcher */}
              <div className="inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewTab("analytics");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewTab === "analytics"
                      ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#0A0E1A] dark:hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab("skuTable");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewTab === "skuTable"
                      ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#0A0E1A] dark:hover:text-white"
                  }`}
                >
                  SKU Table
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab("dispatch");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewTab === "dispatch"
                      ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-[#0A0E1A] dark:hover:text-white"
                  }`}
                >
                  Orders
                </button>
              </div>

              <ThemeSelectDropdown
                value={rangePreset}
                onChange={handlePresetChange}
                options={RANGE_PRESETS}
                buttonClassName="h-9 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] font-semibold"
              />

              <button
                type="button"
                onClick={fetchReport}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D] ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 KPI Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total orders</p>
              <Package className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-[#0A0E1A] dark:text-white">
              {totalOrders.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {Number(kpis.activeSkus || 0)} active SKUs
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Scanned / Packed</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-[#0A0E1A] dark:text-white">
              {scannedOrders.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ▲ {scanPct}% scan completion
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unique customers</p>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-[#0A0E1A] dark:text-white">
              {uniqueCustomers.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Across filtered orders
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top SKU orders</p>
              <TrendingUp className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
            </div>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-[#B88728] dark:text-[#E8C16D]">
              {topSkuOrders.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate" title={topSku}>
              {topSku}
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xl:flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                  <Filter className="w-4 h-4" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search SKU, Order ID, AWB..."
                    className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <ThemeSelectDropdown
                  value={accountId}
                  onChange={(v) => {
                    setAccountId(v);
                    setPage(1);
                  }}
                  options={accountOptions}
                  placeholder="Seller Account"
                  showAllLabel
                  className="w-full"
                  buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                    !accountId
                      ? "font-normal text-slate-400 dark:text-slate-400"
                      : "font-semibold text-[#0A0E1A] dark:text-white"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <ThemeSelectDropdown
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                  options={STATUS_OPTIONS}
                  placeholder="Status"
                  showAllLabel
                  className="w-full"
                  buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                    !status
                      ? "font-normal text-slate-400 dark:text-slate-400"
                      : "font-semibold text-[#0A0E1A] dark:text-white"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <DateRangePicker
                  from={parseFilterDate(startDate)}
                  to={parseFilterDate(endDate)}
                  onChange={(range) => {
                    setRangePreset("all");
                    setStartDate(range.from ? format(range.from, "yyyy-MM-dd") : "");
                    setEndDate(range.to ? format(range.to, "yyyy-MM-dd") : "");
                    setPage(1);
                  }}
                  onClear={() => {
                    setRangePreset("all");
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                  placeholder="Select Date"
                  className="w-full"
                  triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs sm:text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </section>

        {/* Main Content: 4-Panel Analytics Dashboard OR Paginated Table */}
        {viewTab === "analytics" ? (
          <AnalyticsGrid
            analytics={analytics}
            totalOrders={totalOrders}
            loading={loading}
          />
        ) : (
          <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <ReportTableContent
                tab={apiTab}
                rows={rows}
                loading={loading}
                page={page}
                limit={limit}
              />
            </div>

            <div className="px-4 py-3 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Showing <strong className="text-[#0A0E1A] dark:text-white">{startEntry}</strong> –{" "}
                <strong className="text-[#0A0E1A] dark:text-white">{endEntry}</strong> of{" "}
                <strong className="text-[#0A0E1A] dark:text-white">{total}</strong> entries
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Rows:</span>
                <ThemeSelectDropdown
                  value={String(limit)}
                  onChange={(v) => {
                    setLimit(Number(v) || 20);
                    setPage(1);
                  }}
                  options={LIMIT_OPTIONS}
                  buttonClassName="h-8 px-2.5 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]"
                />
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <span className="h-8 px-3 rounded-xl bg-[#E8C16D] text-[#0A0E1A] font-bold inline-flex items-center">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function AnalyticsGrid({
  analytics,
  totalOrders,
  loading,
}: {
  analytics?: AmazonReportAnalytics;
  totalOrders: number;
  loading: boolean;
}) {
  if (loading && !analytics) {
    return (
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-xs text-slate-400">
        Loading Amazon analytics...
      </div>
    );
  }

  const top8 = analytics?.top8Skus || [];
  const maxSkuOrders = Math.max(1, top8[0]?.ordersCount || 1);
  const categories = analytics?.categoryShare || [];
  const dailyTop5 = analytics?.dailyTop5 || { dates: [], series: [] };
  const rankMovers = analytics?.rankMovers || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top 8 SKUs by orders */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
            Top 8 SKUs by orders
          </h2>
          <span className="text-xs font-semibold text-slate-400">orders</span>
        </div>

        {top8.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No SKU order data</div>
        ) : (
          <div className="space-y-3">
            {top8.map((sku, idx) => {
              const pct = Math.max(4, Math.round((sku.ordersCount / maxSkuOrders) * 100));
              return (
                <div key={sku.sellerSku} className="grid grid-cols-[18px_minmax(0,1fr)_90px_40px] sm:grid-cols-[20px_minmax(130px,190px)_1fr_44px] items-center gap-2.5 text-xs">
                  <span className="font-mono text-slate-400 font-semibold">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0A0E1A] dark:text-white truncate" title={sku.sellerSku}>
                      {sku.sellerSku}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {sku.category} · {sku.asin}
                    </p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#FEFAEE] dark:bg-white/[0.06] overflow-hidden border border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background:
                          idx < 3
                            ? "linear-gradient(90deg, #B88728, #E8C16D)"
                            : "linear-gradient(90deg, #D9B25D, #F5D98E)",
                      }}
                    />
                  </div>
                  <span className="text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                    {sku.ordersCount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Order share by category (Donut Chart) */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
            Order share by category
          </h2>
          <span className="text-xs font-semibold text-slate-400">% share</span>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No category data</div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <CategoryDonut categories={categories} totalOrders={totalOrders} />
            <div className="space-y-2.5 w-full sm:w-auto min-w-[160px]">
              {categories.map((c, idx) => (
                <div key={c.category} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="font-semibold text-[#0A0E1A] dark:text-slate-200 truncate">
                      {c.category}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {c.sharePct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. Daily orders - top 5 SKUs (Multi-line Chart) */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
            Daily orders - top 5 SKUs
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {dailyTop5.series.map((s, idx) => (
              <div key={s.sellerSku} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium max-w-[110px] truncate" title={s.sellerSku}>
                  {s.sellerSku}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DailyTop5LineChart dates={dailyTop5.dates} series={dailyTop5.series} />
      </section>

      {/* 4. Rank movers */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
            Rank movers
          </h2>
          <span className="text-xs font-semibold text-slate-400">vs earlier orders</span>
        </div>

        {rankMovers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Not enough order history to compute rank movement
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {rankMovers.map((m) => {
              const up = m.rankDelta > 0;
              return (
                <div
                  key={m.sellerSku}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#0A0E1A] dark:text-white truncate">
                      {m.sellerSku}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {m.subtitle}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold shrink-0 ${
                      up
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {Math.abs(m.rankDelta)} {Math.abs(m.rankDelta) === 1 ? "rank" : "ranks"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryDonut({
  categories,
  totalOrders,
}: {
  categories: { category: string; ordersCount: number; sharePct: number }[];
  totalOrders: number;
}) {
  const size = 160;
  const strokeWidth = 22;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const sum = Math.max(
    1,
    categories.reduce((acc, item) => acc + item.ordersCount, 0)
  );

  let cumulative = 0;
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {categories.map((cat, idx) => {
          const frac = cat.ordersCount / sum;
          const dash = frac * c;
          const offset = -(cumulative * c);
          cumulative += frac;
          return (
            <circle
              key={cat.category}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold font-mono text-[#0A0E1A] dark:text-white leading-none">
          {totalOrders.toLocaleString()}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Orders</p>
      </div>
    </div>
  );
}

function DailyTop5LineChart({
  dates,
  series,
}: {
  dates: string[];
  series: { sellerSku: string; counts: number[] }[];
}) {
  if (dates.length === 0 || series.length === 0) {
    return (
      <div className="py-14 text-center text-xs text-slate-400">
        No daily trend data available
      </div>
    );
  }

  const w = 540;
  const h = 210;
  const padL = 34;
  const padR = 16;
  const padT = 14;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const allVals = series.flatMap((s) => s.counts);
  const maxVal = Math.max(4, ...allVals);
  const ticks = [0, Math.round(maxVal / 2), maxVal];

  const getX = (i: number) =>
    dates.length === 1 ? padL + plotW / 2 : padL + (i / (dates.length - 1)) * plotW;
  const getY = (val: number) => padT + plotH - (val / maxVal) * plotH;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[360px] h-auto">
        {ticks.map((t) => {
          const y = getY(t);
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={y}
                x2={w - padR}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-200 dark:text-white/[0.08]"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {t}
              </text>
            </g>
          );
        })}

        {series.map((s, sIdx) => {
          const color = CHART_COLORS[sIdx % CHART_COLORS.length];
          const points = s.counts.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
          return (
            <g key={s.sellerSku}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {s.counts.map((v, i) => (
                <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={color}>
                  <title>{`${s.sellerSku} (${dates[i]}): ${v} orders`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {dates.map((d, i) => {
          const showLabel =
            dates.length <= 6 ||
            i === 0 ||
            i === dates.length - 1 ||
            i === Math.floor(dates.length / 2);
          if (!showLabel) return null;
          return (
            <text
              key={d}
              x={getX(i)}
              y={h - 6}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-mono"
            >
              {d.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function ReportTableContent({
  tab,
  rows,
  loading,
  page,
  limit,
}: {
  tab: string;
  rows: Record<string, any>[];
  loading: boolean;
  page: number;
  limit: number;
}) {
  const columns = useMemo(() => {
    if (tab === "sku") {
      return [
        { key: "no", label: "No." },
        { key: "asin", label: "ASIN." },
        { key: "sellerSku", label: "Seller SKU." },
        { key: "masterSku", label: "Master SKU." },
        { key: "category", label: "Category." },
        { key: "ordersCount", label: "Orders.", align: "right" },
        { key: "scannedCount", label: "Scanned.", align: "right" },
        { key: "pendingCount", label: "Pending.", align: "right" },
        { key: "currentStock", label: "Stock.", align: "right" },
        { key: "mapped", label: "Mapping." },
      ];
    }
    return [
      { key: "no", label: "No." },
      { key: "date", label: "Date." },
      { key: "batchNo", label: "Batch." },
      { key: "orderId", label: "Order ID." },
      { key: "awb", label: "AWB." },
      { key: "asin", label: "ASIN." },
      { key: "sellerSku", label: "Seller SKU." },
      { key: "masterSku", label: "Master SKU." },
      { key: "packStatus", label: "Pack Status." },
    ];
  }, [tab]);

  return (
    <table className="w-full text-left border-collapse min-w-[820px]">
      <thead>
        <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase">
          {columns.map((c) => (
            <th
              key={c.key}
              className={`py-3 px-3 whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
        {loading ? (
          <tr>
            <td colSpan={columns.length} className="py-16 text-center text-slate-400">
              Loading report data...
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-16 text-center">
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No report records found
                </p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col) => {
                if (col.key === "no") {
                  return (
                    <td key={col.key} className="py-2.5 px-3 font-mono text-slate-500">
                      {(page - 1) * limit + idx + 1}
                    </td>
                  );
                }
                const val = row[col.key];
                if (col.key === "date") {
                  return (
                    <td key={col.key} className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                      {fmtDate(val)}
                    </td>
                  );
                }
                if (col.key === "mapped") {
                  return (
                    <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge value={val ? "Mapped" : "Unmapped"} />
                    </td>
                  );
                }
                if (col.key === "packStatus") {
                  return (
                    <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge value={String(val || "Pending")} />
                    </td>
                  );
                }
                if (col.key === "orderId" || col.key === "batchNo") {
                  return (
                    <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D] font-mono font-semibold">
                        {val || "—"}
                      </span>
                    </td>
                  );
                }
                return (
                  <td
                    key={col.key}
                    className={`py-2.5 px-3 whitespace-nowrap text-[#0A0E1A] dark:text-slate-200 ${
                      col.align === "right" ? "text-right font-mono font-semibold" : ""
                    }`}
                  >
                    {val ?? "—"}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

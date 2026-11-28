"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { ProfitLossResponse, reportService } from "../services/report.service";

const MISSING_COST_OPTIONS: ThemeSelectOption[] = [
  { value: "All", label: "All" },
  { value: "WithCost", label: "With Cost Only" },
  { value: "MissingCost", label: "Missing Cost Only" },
];

const LIMIT_OPTIONS: ThemeSelectOption[] = [
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function parseFilterDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

function fmtMoney(val: number): string {
  const num = Number(val || 0);
  const abs = Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `- ₹ ${abs}` : `₹ ${abs}`;
}

export default function ProfitLossAnalysisView() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [masterSku, setMasterSku] = useState("");
  const [productSku, setProductSku] = useState("");
  const [missingCost, setMissingCost] = useState("All");
  const [includeAllCompany, setIncludeAllCompany] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitLossResponse | null>(null);

  // Load filter dropdown options on mount
  useEffect(() => {
    reportService
      .getAccountReport("profit-loss", { page: 1, limit: 1 })
      .then((res) => {
        setData((prev) => ({
          ...(prev || { kpis: {}, rows: [], total: 0, page: 1, limit: 20 }),
          filterOptions: res.filterOptions,
        }));
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback(
    async (targetPage = 1, targetLimit = limit) => {
      try {
        setLoading(true);
        const res = await reportService.getAccountReport("profit-loss", {
          startDate,
          endDate,
          category: category || "All",
          masterSku: masterSku || "All",
          productSku: productSku || "All",
          missingCost,
          includeAllCompany,
          page: targetPage,
          limit: targetLimit,
        });
        setData(res);
        setHasSearched(true);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load Profit & Loss Analysis");
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, category, masterSku, productSku, missingCost, includeAllCompany, limit]
  );

  const handleSearchClick = () => {
    setPage(1);
    runSearch(1, limit);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setCategory("");
    setMasterSku("");
    setProductSku("");
    setMissingCost("All");
    setIncludeAllCompany(true);
    setPage(1);
    setHasSearched(false);
  };

  const handleDownload = () => {
    const rows = data?.rows || [];
    if (!hasSearched || rows.length === 0) {
      toast.info("Search and load data first before downloading.");
      return;
    }
    const exportRows = rows.map((r, idx) => ({
      "No.": idx + 1,
      "Product SKU": r.productSku,
      "Master SKU": r.masterSku,
      Category: r.category,
      Units: r.units,
      "Avg Sales Rate": r.avgSalesRate,
      "Sales Amount": r.salesAmount,
      "Avg Cost": r.avgCost,
      "Cost Amount": r.costAmount,
      "P/L Amount": r.plAmount,
      "P/L %": `${r.plPercent}%`,
      "P/L Amount / Pcs": r.plPerPcs,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
    XLSX.writeFile(wb, `profit-loss-offline-sales-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Profit & Loss Excel downloaded.");
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard?.writeText(txt);
    toast.success(`Copied ${txt}`);
  };

  const categoryOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "All", label: "All" },
      ...(data?.filterOptions?.categories || []).map((c) => ({ value: c, label: c })),
    ],
    [data?.filterOptions?.categories]
  );

  const masterSkuOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "All", label: "All" },
      ...(data?.filterOptions?.masterSkus || []).map((m) => ({ value: m, label: m })),
    ],
    [data?.filterOptions?.masterSkus]
  );

  const productSkuOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "All", label: "All" },
      ...(data?.filterOptions?.productSkus || []).map((p) => ({ value: p, label: p })),
    ],
    [data?.filterOptions?.productSkus]
  );

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(total, page * limit);

  return (
    <DashboardLayout title="Profit & Loss Analysis [ Offline Sales ]">
      <div className="w-full space-y-4">
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Profit &amp; Loss Analysis [ Offline Sales ]
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Product wise profit and loss analysis of offline sales.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer transition shrink-0"
            >
              <Download className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Download</span>
            </button>
          </div>

          {/* Filter Strip */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/40 dark:bg-[#080B11]/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:items-end gap-2.5">
              {/* Date Range */}
              <div className="space-y-1 min-w-0 xl:flex-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Date Range <span className="text-rose-500">*</span>
                </label>
                <DateRangePicker
                  from={parseFilterDate(startDate)}
                  to={parseFilterDate(endDate)}
                  onChange={(range) => {
                    setStartDate(range.from ? format(range.from, "yyyy-MM-dd") : "");
                    setEndDate(range.to ? format(range.to, "yyyy-MM-dd") : "");
                  }}
                  onClear={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  placeholder="Select date range"
                  className="w-full"
                  triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]"
                />
              </div>

              {/* Category */}
              <div className="space-y-1 min-w-0 xl:flex-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Category
                </label>
                <ThemeSelectDropdown
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  placeholder="Select category"
                  showAllLabel
                  className="w-full"
                  buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] ${
                    !category
                      ? "font-normal text-slate-400"
                      : "font-semibold text-[#0A0E1A] dark:text-white"
                  }`}
                />
              </div>

              {/* Master Product SKU */}
              <div className="space-y-1 min-w-0 xl:flex-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Master Product SKU
                </label>
                <ThemeSelectDropdown
                  value={masterSku}
                  onChange={setMasterSku}
                  options={masterSkuOptions}
                  placeholder="Select master SKU"
                  showAllLabel
                  className="w-full"
                  buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] ${
                    !masterSku
                      ? "font-normal text-slate-400"
                      : "font-semibold text-[#0A0E1A] dark:text-white"
                  }`}
                />
              </div>

              {/* Product SKU */}
              <div className="space-y-1 min-w-0 xl:flex-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Product SKU
                </label>
                <ThemeSelectDropdown
                  value={productSku}
                  onChange={setProductSku}
                  options={productSkuOptions}
                  placeholder="Select product SKU"
                  showAllLabel
                  className="w-full"
                  buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] ${
                    !productSku
                      ? "font-normal text-slate-400"
                      : "font-semibold text-[#0A0E1A] dark:text-white"
                  }`}
                />
              </div>

              {/* Missing Cost */}
              <div className="space-y-1 min-w-0 xl:w-36 xl:shrink-0">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Missing Cost
                </label>
                <ThemeSelectDropdown
                  value={missingCost}
                  onChange={setMissingCost}
                  options={MISSING_COST_OPTIONS}
                  showAllLabel
                  className="w-full"
                  buttonClassName="w-full justify-between h-9 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold text-[#0A0E1A] dark:text-white"
                />
              </div>

              {/* Include All Company + Search + Reset */}
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 xl:shrink-0">
                <button
                  type="button"
                  onClick={() => setIncludeAllCompany((p) => !p)}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-xs font-semibold text-[#0A0E1A] dark:text-white cursor-pointer shrink-0"
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded border transition ${
                      includeAllCompany
                        ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A]"
                        : "border-slate-300 dark:border-white/[0.2]"
                    }`}
                  >
                    {includeAllCompany && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="whitespace-nowrap">Include All Company</span>
                </button>

                <button
                  type="button"
                  onClick={handleSearchClick}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer transition shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? "Loading..." : "Search"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#0F1626] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] cursor-pointer transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {!hasSearched ? (
            <div className="flex-1 grid place-items-center p-10 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Select date range and click Search to load data.
                </p>
                <p className="text-xs text-slate-400">
                  Apply filters and search to view the report
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                      <th className="py-3 px-3 w-12">No.</th>
                      <th className="py-3 px-3 min-w-[260px]">SKUs &amp; Category.</th>
                      <th className="py-3 px-3 text-right">Units.</th>
                      <th className="py-3 px-3 text-right">Avg Sales Rate.</th>
                      <th className="py-3 px-3 text-right">Sales Amount.</th>
                      <th className="py-3 px-3 text-right">Avg Cost.</th>
                      <th className="py-3 px-3 text-right">Cost Amount.</th>
                      <th className="py-3 px-3 text-right">P/L Amount.</th>
                      <th className="py-3 px-3 text-right">P/L %.</th>
                      <th className="py-3 px-3 text-right">P/L Amount / Pcs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          Calculating product-wise profit &amp; loss...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center text-slate-400">
                          No offline sales records found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, idx) => {
                        const isProfit = Number(r.plAmount || 0) >= 0;
                        const plColor = isProfit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400";
                        const monogram = String(r.productSku || "PR")
                          .replace(/[^A-Za-z0-9]/g, "")
                          .slice(0, 2)
                          .toUpperCase() || "PR";

                        return (
                          <tr
                            key={r.id || idx}
                            className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {(page - 1) * limit + idx + 1}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {r.imageUrl ? (
                                  <img
                                    src={r.imageUrl}
                                    alt={r.productSku}
                                    className="h-10 w-10 rounded-xl object-cover border border-[#E8C16D]/30 shrink-0"
                                  />
                                ) : (
                                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 font-bold text-[11px] shrink-0">
                                    {monogram}
                                  </div>
                                )}
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#0A0E1A] dark:text-white truncate">
                                      SKU. {r.productSku}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(r.productSku)}
                                      className="text-slate-400 hover:text-[#B88728] cursor-pointer"
                                      title="Copy Product SKU"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate">Master SKU. {r.masterSku}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(r.masterSku)}
                                      className="text-slate-400 hover:text-[#B88728] cursor-pointer"
                                      title="Copy Master SKU"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate">
                                    Category: {r.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                              {r.units}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {fmtMoney(r.avgSalesRate)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                              {fmtMoney(r.salesAmount)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {fmtMoney(r.avgCost)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                              {fmtMoney(r.costAmount)}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${plColor}`}>
                              {fmtMoney(r.plAmount)}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${plColor}`}>
                              {Number(r.plPercent || 0).toFixed(2)}%
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${plColor}`}>
                              {fmtMoney(r.plPerPcs)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {summary && rows.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-[#E8C16D]/40 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
                        <td colSpan={2} className="py-3 px-3 text-[#0A0E1A] dark:text-white">
                          Total. {total}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#0A0E1A] dark:text-white">
                          {summary.totalUnits}
                        </td>
                        <td className="py-3 px-3" />
                        <td className="py-3 px-3 text-right font-mono text-[#0A0E1A] dark:text-white whitespace-nowrap">
                          {fmtMoney(summary.totalSalesAmount)}
                        </td>
                        <td className="py-3 px-3" />
                        <td className="py-3 px-3 text-right font-mono text-[#0A0E1A] dark:text-white whitespace-nowrap">
                          {fmtMoney(summary.totalCostAmount)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono whitespace-nowrap ${
                            summary.totalPlAmount >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {fmtMoney(summary.totalPlAmount)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono whitespace-nowrap ${
                            summary.totalPlPercent >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {summary.totalPlPercent.toFixed(2)}%
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono whitespace-nowrap ${
                            summary.totalPlPerPcs >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {fmtMoney(summary.totalPlPerPcs)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Showing <strong className="text-[#0A0E1A] dark:text-white">{startEntry}</strong> to{" "}
                  <strong className="text-[#0A0E1A] dark:text-white">{endEntry}</strong> of{" "}
                  <strong className="text-[#0A0E1A] dark:text-white">{total}</strong> entries
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Rows:</span>
                  <ThemeSelectDropdown
                    value={String(limit)}
                    onChange={(v) => {
                      const nextLimit = Number(v) || 20;
                      setLimit(nextLimit);
                      setPage(1);
                      runSearch(1, nextLimit);
                    }}
                    options={LIMIT_OPTIONS}
                    buttonClassName="h-8 px-2.5 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]"
                  />
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      const p = Math.max(1, page - 1);
                      setPage(p);
                      runSearch(p, limit);
                    }}
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
                    onClick={() => {
                      const p = Math.min(totalPages, page + 1);
                      setPage(p);
                      runSearch(p, limit);
                    }}
                    className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Layers,
  FileText,
  Barcode,
  RotateCcw,
  Sparkles,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/ui/Button";
import { useAmazonOrderStore } from "../store/useAmazonOrderStore";

interface ComparisonResultViewProps {
  isStandaloneTab?: boolean;
  onReset?: () => void;
}

export default function ComparisonResultView({
  onReset,
}: ComparisonResultViewProps) {
  const { summary, results, combinedPdfUrl, downloadCombinedPdf, clearProcessData } =
    useAmazonOrderStore();

  const [activeTab, setActiveTab] = useState<"table" | "combinedPdf">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "matched" | "mismatch">("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Pagination state (same as Myntra order)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      clearProcessData();
    }
  };

  // Filter and search results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Status filter
      if (filterStatus === "matched" && !item.isMatch) return false;
      if (filterStatus === "mismatch" && item.isMatch) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.zplInvoice.toLowerCase().includes(q) ||
        item.pdfInvoice.toLowerCase().includes(q) ||
        item.orderNumber.toLowerCase().includes(q) ||
        item.awb.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q)
      );
    });
  }, [results, filterStatus, searchQuery]);

  // Pagination calculations (exact Myntra logic)
  const totalRecords = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRecords);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const allPageSelected =
    paginatedResults.length > 0 &&
    paginatedResults.every((item) => selectedRows.has(item.index));

  const toggleAllPage = () => {
    const next = new Set(selectedRows);
    if (allPageSelected) {
      paginatedResults.forEach((item) => next.delete(item.index));
    } else {
      paginatedResults.forEach((item) => next.add(item.index));
    }
    setSelectedRows(next);
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    setSelectedRows(next);
  };

  if (!summary || results.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-[#E8C16D]" />
        <h3 className="text-xl font-bold text-foreground">No Processed Order Data Found</h3>
        <p className="mx-auto mt-1 mb-6 max-w-md text-sm text-muted-foreground">
          Please upload both Amazon PDF and ZPL files to run conversion and verification.
        </p>
        <Button
          type="button"
          onClick={handleReset}
          className="mx-auto border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
        >
          Go to File Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* AMAZON ORDER VERIFICATION RESULTS SECTION */}
      {/* ===================================================== */}
      <div className="border border-[#E7E0D2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                <CheckCheck className="h-3.5 w-3.5" />
                Conversion & Verification Complete
              </span>
              <span className="text-xs font-medium text-slate-500">
                {new Date(summary.processedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#0A0E1A]">
              Amazon Order Verification Results
            </h2>

            <p className="text-sm text-slate-500">
              Files: <strong className="text-slate-800">{summary.pdfFileName}</strong> &{" "}
              <strong className="text-slate-800">{summary.zplFileName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-11 items-center justify-center gap-2 bg-[#0A0E1A] px-5 text-sm font-semibold text-white transition hover:bg-[#161D2E]"
            >
              <RotateCcw size={16} />
              New Batch
            </button>
          </div>
        </div>

        {/* =================================================== */}
        {/* STATS CARDS (EXACT STATSCARDS CSS LIKE DASHBOARD) */}
        {/* =================================================== */}
        <div className="mt-6 grid gap-4 border-t border-[#E7E0D2] pt-6 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Total ZPL */}
          <article
            onClick={() => {
              setActiveTab("table");
              setFilterStatus("all");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              ZPL Labels
            </p>

            <div className="mt-4 flex items-end justify-between gap-3">
              <h3 className="text-3xl font-bold text-[#0A0E1A]">
                {summary.totalZplLabels}
              </h3>

              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                Converted
              </span>
            </div>
          </article>

          {/* Card 2: Total PDF Orders */}
          <article
            onClick={() => {
              setActiveTab("table");
              setFilterStatus("all");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              PDF Orders
            </p>

            <div className="mt-4 flex items-end justify-between gap-3">
              <h3 className="text-3xl font-bold text-[#0A0E1A]">
                {summary.totalPdfOrders}
              </h3>

              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                {summary.totalPdfPages} pgs
              </span>
            </div>
          </article>

          {/* Card 3: Matched Rate */}
          <article
            onClick={() => {
              setActiveTab("table");
              setFilterStatus("matched");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              Matched Invoices
            </p>

            <div className="mt-4 flex items-end justify-between gap-3">
              <h3 className="text-3xl font-bold text-[#0A0E1A]">
                {summary.matchedCount}
              </h3>

              <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                {summary.matchPercentage}%
              </span>
            </div>
          </article>

          {/* Card 4: Mismatches */}
          <article
            onClick={() => {
              setActiveTab("table");
              setFilterStatus("mismatch");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              Mismatches
            </p>

            <div className="mt-4 flex items-end justify-between gap-3">
              <h3 className="text-3xl font-bold text-[#0A0E1A]">
                {summary.mismatchCount}
              </h3>

              <span
                className={`rounded px-2 py-1 text-xs font-bold ${
                  summary.mismatchCount === 0
                    ? "bg-slate-100 text-slate-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {summary.mismatchCount === 0 ? "0" : `-${summary.mismatchCount}`}
              </span>
            </div>
          </article>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TABS (MYNTRA BUTTON STYLE - SAME HEIGHT & WIDTH) */}
      {/* ===================================================== */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("table");
            setFilterStatus("all");
            setPage(1);
          }}
          className={`inline-flex h-14 w-64 items-center justify-center gap-2 border text-sm font-semibold transition-all duration-200 ${
            activeTab === "table" && filterStatus !== "mismatch"
              ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
              : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
          }`}
        >
          <Layers className="h-4 w-4" />
          Comparison Table ({results.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("table");
            setFilterStatus("mismatch");
            setPage(1);
          }}
          className={`inline-flex h-14 w-64 items-center justify-center gap-2 border text-sm font-semibold transition-all duration-200 ${
            activeTab === "table" && filterStatus === "mismatch"
              ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
              : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Mismatch Section ({summary.mismatchCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("combinedPdf")}
          className={`inline-flex h-14 w-64 items-center justify-center gap-2 border text-sm font-semibold transition-all duration-200 ${
            activeTab === "combinedPdf"
              ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
              : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Combined Matched PDF
        </button>
      </div>

      {/* ===================================================== */}
      {/* TAB 1: COMPARISON TABLE VIEW */}
      {/* ===================================================== */}
      {activeTab === "table" && (
        <div className="space-y-4">
          {/* Table Filters & Search */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Box */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Order ID, Invoice #, AWB, Customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-14 w-full border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#E8C16D]"
              />
            </div>

            {/* Status Filter Buttons (SAME HEIGHT & WIDTH AS MYNTRA) */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setPage(1);
                }}
                className={`inline-flex h-14 w-44 items-center justify-center gap-1.5 border text-sm font-semibold transition-all duration-200 ${
                  filterStatus === "all"
                    ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                    : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
                }`}
              >
                All ({results.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("matched");
                  setPage(1);
                }}
                className={`inline-flex h-14 w-44 items-center justify-center gap-1.5 border text-sm font-semibold transition-all duration-200 ${
                  filterStatus === "matched"
                    ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                    : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
                }`}
              >
                Matched ({summary.matchedCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("mismatch");
                  setPage(1);
                }}
                className={`inline-flex h-14 w-44 items-center justify-center gap-1.5 border text-sm font-semibold transition-all duration-200 ${
                  filterStatus === "mismatch"
                    ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                    : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
                }`}
              >
                Mismatch ({summary.mismatchCount})
              </button>
            </div>
          </div>

          {/* Table Container (EXACT MYNTRA ORDERTABLE STYLING & FONT SIZE) */}
          <div className="overflow-hidden border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-[#0A0E1A] text-lg text-[#E8C16D]">
                  <tr className="border-b border-border">
                    <th className="w-14 px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleAllPage}
                        />
                      </div>
                    </th>
                    <th className="w-[12%] px-4 py-4 text-center font-semibold">Status</th>
                    <th className="w-[16%] px-4 py-4 text-center font-semibold">PDF Invoice</th>
                    <th className="w-[16%] px-4 py-4 text-center font-semibold">ZPL Invoice</th>
                    <th className="w-[20%] px-4 py-4 text-center font-semibold">Amazon Order ID</th>
                    <th className="w-[18%] px-4 py-4 text-center font-semibold">AWB Tracking</th>
                    <th className="w-[18%] px-4 py-4 text-center font-semibold">Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No orders match your current search or filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((item) => (
                      <tr
                        key={item.index}
                        className="border-b border-border transition hover:bg-muted/30"
                      >
                        <td className="w-14 px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRows.has(item.index)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(item.index, Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {item.isMatch ? (
                            <span className="rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500">
                              Matched
                            </span>
                          ) : (
                            <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                              Mismatch
                            </span>
                          )}
                        </td>
                        <td className="truncate px-4 py-4 text-center">
                          {item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF" ? (
                            <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500">
                              {item.pdfInvoice}
                            </span>
                          ) : (
                            <span className="italic text-xs text-muted-foreground">
                              Not Found in PDF
                            </span>
                          )}
                        </td>
                        <td className="truncate px-4 py-4 text-center">
                          {item.zplInvoice &&
                          item.zplInvoice !== "Not Found in ZPL" &&
                          item.zplInvoice !== "N/A" ? (
                            <span className="rounded-md bg-[#E8C16D]/15 px-2.5 py-1 text-xs font-semibold text-[#E8C16D]">
                              {item.zplInvoice}
                            </span>
                          ) : (
                            <span className="italic text-xs text-muted-foreground">
                              Not Found in ZPL
                            </span>
                          )}
                        </td>
                        <td className="truncate px-4 py-4 text-center font-medium">
                          {item.orderNumber}
                        </td>
                        <td className="truncate px-4 py-4 text-center">
                          {item.awb}
                        </td>
                        <td className="truncate px-4 py-4 text-center">
                          {item.customer}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================== */}
          {/* PAGINATION (EXACT MYNTRA PAGINATION COMPONENT) */}
          {/* =================================================== */}
          <div className="mt-6 flex flex-col gap-4 border border-border bg-[#0A0E1A] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="text-sm text-white">
              Showing{" "}
              <span className="font-semibold text-white">
                {totalRecords === 0 ? 0 : startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-white">{endIndex}</span>
              {" of "}
              <span className="font-semibold text-white">{totalRecords}</span>{" "}
              records
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Rows */}
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm text-white">Rows</span>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
                >
                  {[10, 20, 25, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="w-30 border-[#E8C16D] bg-[#E8C16D] font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              {/* Page */}
              <div className="flex h-9 min-w-[80px] items-center justify-center border border-border bg-muted px-4 text-sm font-semibold text-foreground">
                {currentPage} / {totalPages}
              </div>

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="w-30 border-[#E8C16D] bg-[#E8C16D] font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COMBINED MATCHED PDF VIEWER */}
      {/* ======================================================== */}
      {activeTab === "combinedPdf" && (
        <div className="space-y-4 border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Combined Matched Paired PDF
              </h3>
              <p className="text-xs text-muted-foreground">
                Interleaved dispatch document (Each ZPL barcode label is immediately followed by its matching invoice)
              </p>
            </div>
            <Button
              type="button"
              onClick={downloadCombinedPdf}
              leftIcon={<Download className="h-4 w-4" />}
              className="border-[#E8C16D] bg-[#E8C16D] font-semibold text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
            >
              Download PDF
            </Button>
          </div>

          {combinedPdfUrl ? (
            <div className="h-[750px] w-full overflow-hidden border border-border bg-[#0A0E1A]">
              <iframe
                src={`${combinedPdfUrl}#toolbar=1&navpanes=1&statusbar=1`}
                className="h-full w-full border-none"
                title="Combined Matched PDF"
              />
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              PDF preview unavailable. Please use the download button above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
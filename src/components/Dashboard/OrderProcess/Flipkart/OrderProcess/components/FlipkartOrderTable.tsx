"use client";

import React, { useMemo, useRef } from "react";
import {
  Printer,
  FileText,
  CheckCircle2,
  Loader2,
  Zap,
  X,
  Search,
  EyeOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/ui/Pagination";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { FlipkartOrderItem } from "../types";

export interface FlipkartOrderTableProps {
  // Data
  paginatedOrders: FlipkartOrderItem[];
  filteredOrdersCount: number;
  totalFilteredOrders: number;
  mappedOrdersCount: number;
  remainingCount: number;
  printedCountVal: number;
  printedOrders: Set<number>;
  selectedRows: Set<number>;
  allPageSelected: boolean;
  onSelectRow: (index: number, selected: boolean) => void;
  onToggleAllPage: () => void;
  skuDetailsMap: Map<string, { fsn?: string; asin?: string; rackAddress?: string }>;

  // Search & Filters
  searchQuery: string;
  onSearchChange: (val: string) => void;
  orderTypeFilter: string;
  onOrderTypeFilterChange: (val: string) => void;
  orderTypeOptions: SelectOption[];
  showPrinted: boolean;
  onToggleShowPrinted: () => void;

  // Auto-print Scanner Bar
  autoPrintInputRef: React.RefObject<HTMLInputElement | null>;
  autoPrintQuery: string;
  onAutoPrintQueryChange: (val: string) => void;
  onAutoPrint: (query: string) => void;

  // Printing & Actions
  availablePrinters: string[];
  selectedPrinter: string;
  onPrinterChange: (val: string) => void;
  printerOptions: SelectOption[];
  onPrintSingle: (order: FlipkartOrderItem) => void;
  onPrintSelectedOrAll: () => void;
  onOpenPicklistModal: () => void;
  isGeneratingPicklist: boolean;
  isMappingsLoading: boolean;

  // Pagination
  currentPage: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;

  // Container styling
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  targetHeight?: number | null;
  isDesktop?: boolean;
  isDark?: boolean;
}

export default function FlipkartOrderTable({
  paginatedOrders,
  filteredOrdersCount,
  totalFilteredOrders,
  mappedOrdersCount,
  remainingCount,
  printedCountVal,
  printedOrders,
  selectedRows,
  allPageSelected,
  onSelectRow,
  onToggleAllPage,
  skuDetailsMap,
  searchQuery,
  onSearchChange,
  orderTypeFilter,
  onOrderTypeFilterChange,
  orderTypeOptions,
  showPrinted,
  onToggleShowPrinted,
  autoPrintInputRef,
  autoPrintQuery,
  onAutoPrintQueryChange,
  onAutoPrint,
  availablePrinters,
  selectedPrinter,
  onPrinterChange,
  printerOptions,
  onPrintSingle,
  onPrintSelectedOrAll,
  onOpenPicklistModal,
  isGeneratingPicklist,
  isMappingsLoading,
  currentPage,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  tableContainerRef,
  targetHeight = null,
  isDesktop = false,
  isDark = false,
}: FlipkartOrderTableProps) {
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectThemeStyles = useMemo(
    () => ({
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E7E0D2",
      backgroundColor: isDark ? "#0A0E1A" : "#FFFFFF",
      textColor: isDark ? "#E8C16D" : "#0A0E1A",
      placeholderColor: isDark ? "#E8C16D" : "#64748B",
      indicatorColor: isDark ? "#E8C16D" : "#0A0E1A",
      menuBackgroundColor: isDark ? "#0A0E1A" : "#FFFFFF",
      optionHoverColor: isDark ? "#161D2E" : "#FFF9EC",
      optionSelectedColor: "#E8C16D",
      optionSelectedTextColor: "#0A0E1A",
      optionTextColor: isDark ? "#ffffff" : "#0A0E1A",
      menuPortalTarget: typeof window !== "undefined" ? document.body : undefined,
    }),
    [isDark]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* ========================================== */}
      {/* TOOLBAR CONTROLS ROW                       */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-2.5 sm:gap-3 items-center">
        {/* ROW 1 RIGHT: Instant Auto-Print Scan Bar */}
        <div className="w-full xl:min-w-[480px] xl:col-start-2">
          <div className="group relative flex items-center gap-2.5 rounded-2xl border-2 border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all w-full h-11 sm:h-12 focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FAF0D4] dark:bg-[#251E11] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/40">
              <Zap className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <input
              ref={autoPrintInputRef}
              type="text"
              placeholder={
                orderTypeFilter === "single_quantity"
                  ? "Scan Single Quantity SKU, Order ID, or AWB to print..."
                  : orderTypeFilter === "multiple_sku"
                    ? "Scan Multiple FSN items to print..."
                    : "Scan Multiple Pieces items to print..."
              }
              value={autoPrintQuery}
              onChange={(e) => {
                const val = e.target.value;
                onAutoPrintQueryChange(val);
                if (autoScanTimerRef.current) {
                  clearTimeout(autoScanTimerRef.current);
                }
                const trimmed = val.trim();
                if (trimmed.length >= 8) {
                  autoScanTimerRef.current = setTimeout(() => {
                    const cur = autoPrintInputRef.current?.value.trim();
                    if (cur && cur === trimmed) {
                      autoPrintInputRef.current?.select();
                      onAutoPrint(cur);
                    }
                  }, 180);
                }
              }}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (autoScanTimerRef.current) {
                    clearTimeout(autoScanTimerRef.current);
                  }
                  const raw = e.currentTarget.value.trim() || autoPrintQuery.trim();
                  if (raw) {
                    autoPrintInputRef.current?.select();
                    onAutoPrint(raw);
                  }
                }
              }}
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 placeholder:font-normal outline-none"
            />
            {autoPrintQuery ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAutoPrintQueryChange("");
                  setTimeout(() => {
                    autoPrintInputRef.current?.focus();
                  }, 10);
                }}
                onClick={() => {
                  onAutoPrintQueryChange("");
                  autoPrintInputRef.current?.focus();
                }}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                title="Clear scanner input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* FULL WIDTH DIVIDER */}
      <div className="border-b border-[#E7E0D2] dark:border-white/[0.08] my-0.5" />

      {/* ROW 2: SEARCH, PRINTER, FILTERS, PICKLIST & PRINT BUTTONS */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 sm:gap-3">
        {/* ROW 2 LEFT: Search Box + Connected Printer Selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-1">
          {/* Search Box */}
          <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#0B0F17] flex-1 min-w-[200px]">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search Order ID, Invoice #, FSN, AWB, Customer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Connected Printer Selector */}
          <div className="w-full sm:w-48 md:w-52 shrink-0">
            <ReactSelect
              borderRadius={16}
              options={printerOptions}
              value={
                printerOptions.find((opt) => opt.value === selectedPrinter) ??
                (selectedPrinter ? { label: selectedPrinter, value: selectedPrinter } : null)
              }
              onChange={(opt) => {
                if (opt?.value) {
                  onPrinterChange(opt.value);
                }
              }}
              placeholder={
                availablePrinters.length === 0 ? "No Printers Found" : "Select Printer"
              }
              height={48}
              {...selectThemeStyles}
            />
          </div>
        </div>

        {/* ROW 2 RIGHT: Order Type Select + Picklist + Show Printed + Print Action */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          {/* Order Composition Filter Select Dropdown */}
          <div className="w-full sm:w-52 md:w-56 shrink-0">
            <ReactSelect
              borderRadius={16}
              options={orderTypeOptions}
              value={
                orderTypeOptions.find((opt) => opt.value === orderTypeFilter) ??
                orderTypeOptions[0]
              }
              onChange={(opt) => {
                if (opt?.value) {
                  onOrderTypeFilterChange(opt.value);
                }
              }}
              height={48}
              {...selectThemeStyles}
            />
          </div>

          {/* Picklist Button (Opens FlipkartPicklistModal) */}
          <button
            type="button"
            disabled={isMappingsLoading || isGeneratingPicklist}
            onClick={onOpenPicklistModal}
            className={`inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] ${isMappingsLoading || isGeneratingPicklist
              ? "cursor-not-allowed border-[#E8C16D]/30 bg-[#FEFAEE]/60 text-[#6A4D1D]/60 dark:border-[#0A0E1A]/40 dark:bg-[#0A0E1A]/60 dark:text-[#E8C16D]/60"
              : "cursor-pointer border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0"
              }`}
            title="Open Flipkart Picklist options"
          >
            {isGeneratingPicklist ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#E8C16D]" />
                <span className="whitespace-nowrap">Generating...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">
                  Picklist{" "}
                  {selectedRows.size > 0
                    ? `(${selectedRows.size})`
                    : `(All ${mappedOrdersCount})`}
                </span>
              </>
            )}
          </button>

          {/* Toggle Show Printed / Unprinted Orders */}
          {printedCountVal > 0 && (
            <button
              type="button"
              onClick={onToggleShowPrinted}
              className={`inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${showPrinted
                ? "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                : "border-[#E8C16D] dark:border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251E11] ring-2 ring-[#E8C16D]/30"
                }`}
            >
              {showPrinted ? (
                <>
                  <EyeOff className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    Back to Unprinted ({remainingCount})
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">
                    Show Printed ({printedCountVal})
                  </span>
                </>
              )}
            </button>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={onPrintSelectedOrAll}
            className="inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>
              Print {selectedRows.size > 0 ? `(${selectedRows.size})` : ""}
            </span>
          </button>
        </div>
      </div>

      {/* Active "Show Printed Only" Banner Indicator */}
      {showPrinted && (
        <div className="shrink-0 flex items-center justify-between rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/90 dark:bg-emerald-950/30 px-4 py-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">
              Viewing Printed Orders Only ({filteredOrdersCount})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              — Displaying only orders that have already been printed.
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleShowPrinted}
            className="font-bold underline underline-offset-4 hover:opacity-80 cursor-pointer text-xs ml-2 shrink-0 text-emerald-700 dark:text-emerald-400"
          >
            Back to Unprinted ({remainingCount})
          </button>
        </div>
      )}

      {/* =================================================== */}
      {/* MOBILE VIEW: RESPONSIVE ORDER CARDS (< 768px)       */}
      {/* =================================================== */}
      <div className="space-y-3 md:hidden">
        {/* Mobile Select All Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] p-3 text-xs font-bold text-white shadow-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={allPageSelected} onCheckedChange={onToggleAllPage} />
            <span>Select All Page ({paginatedOrders.length})</span>
          </label>
          <span className="text-[#E8C16D] font-bold">
            {selectedRows.size} Selected
          </span>
        </div>

        {paginatedOrders.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm space-y-2">
            <p>
              {showPrinted
                ? "No printed orders match your current filter."
                : printedOrders.size > 0
                  ? `All orders in this view have been printed! (${printedCountVal} printed)`
                  : "No orders match your current search or filter."}
            </p>
            {printedOrders.size > 0 && !showPrinted ? (
              <button
                type="button"
                onClick={onToggleShowPrinted}
                className="font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Click here to view printed orders ({printedCountVal})
              </button>
            ) : showPrinted ? (
              <button
                type="button"
                onClick={onToggleShowPrinted}
                className="font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Click here to return to unprinted orders ({remainingCount})
              </button>
            ) : null}
          </div>
        ) : (
          paginatedOrders.map((item) => (
            <div
              key={item.index}
              className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all space-y-2.5 ${selectedRows.has(item.index)
                ? "border-[#E8C16D] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/50 ring-1 ring-[#E8C16D]"
                : "border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] hover:border-[#E8C16D]/40"
                }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
                <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                  <Checkbox
                    checked={selectedRows.has(item.index)}
                    onCheckedChange={(checked) =>
                      onSelectRow(item.index, Boolean(checked))
                    }
                  />
                  <span className="font-mono text-xs font-bold text-[#0A0E1A] dark:text-white truncate">
                    #{item.orderNumber} • {item.orderId}
                  </span>
                </label>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => onPrintSingle(item)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] transition active:scale-95 cursor-pointer"
                    title={`Silently print shipping label for ${item.orderId}`}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <span className="rounded-lg bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider border border-amber-200/60 dark:border-amber-900/40">
                    {item.orderType === "multiple_sku"
                      ? "Multiple FSN"
                      : item.orderType === "multiple_pieces"
                        ? "Multiple Pieces"
                        : "Single Quantity"}
                  </span>
                </div>
              </div>

              {/* Card Detail Grid (2x2) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* AWB Tracking */}
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    AWB Tracking
                  </span>
                  <div className="flex items-center justify-between gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate block">{item.awb || "—"}</span>
                    {printedOrders.has(item.pageIndex) && (
                      <span className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:text-blue-300 inline-flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Printed
                      </span>
                    )}
                  </div>
                </div>

                {/* 
                // =========================================================================
                // PREVIOUS FSN CODE DISPLAY
                // (Commented out: uncomment when switching back to FSN Code from FlipkartImport)
                // =========================================================================
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    FSN Code
                  </span>
                  {item.items && item.items.length > 1 ? (
                    <div className="flex flex-col gap-0.5 font-medium text-[#0A0E1A] dark:text-white">
                      {item.items.map((i, idx) => (
                        <span key={idx} className="truncate">
                          {i.fsn || skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn || "—"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-medium text-[#0A0E1A] dark:text-white truncate block">
                      {item.fsn || "—"}
                    </span>
                  )}
                </div>
                */}

                {/* FSN Code from FlipkartImports */}
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    FSN Code
                  </span>
                  {item.items && item.items.length > 1 ? (
                    <div className="flex flex-col gap-0.5 font-medium text-[#0A0E1A] dark:text-white">
                      {item.items.map((i, idx) => (
                        <span key={idx} className="truncate">
                          {i.fsn || skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn || "—"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="font-medium text-[#0A0E1A] dark:text-white truncate block">
                      {item.fsn || "—"}
                    </span>
                  )}
                </div>

                {/* Rack Address from AsinImport */}
                <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    Rack Address
                  </span>
                  {item.items && item.items.length > 1 ? (
                    <div className="flex flex-col gap-0.5 font-medium text-[#0A0E1A] dark:text-white">
                      {item.items.map((i, idx) => {
                        const rack = i.rackAddress || skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.rackAddress || "—";
                        return (
                          <span key={idx} className={`truncate ${rack && rack !== "—" && rack !== "Not assigned" ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}`}>
                            {rack && rack !== "Not assigned" ? rack : "—"}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className={`font-medium truncate block ${item.rackAddress && item.rackAddress !== "—" && item.rackAddress !== "Not assigned" ? "font-semibold text-emerald-700 dark:text-emerald-400 text-[#0A0E1A] dark:text-white" : "text-[#0A0E1A] dark:text-white"}`}>
                      {item.rackAddress && item.rackAddress !== "Not assigned" ? item.rackAddress : "—"}
                    </span>
                  )}
                </div>

                {/* SKU Code */}
                <div className="col-span-2 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                    SKU Details
                  </span>
                  {item.items && item.items.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {item.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-900 dark:text-white truncate">{i.sku}</span>
                          {(i.quantity || 1) > 1 && (
                            <span className="rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {i.quantity} Pcs
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                      {item.sku || "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================================================== */}
      {/* DESKTOP VIEW: STICKY TABLE WITH PAGINATION (>= 768px) */}
      {/* ===================================================== */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px]"
          style={{
            maxHeight: isDesktop && targetHeight ? `${targetHeight - 80}px` : undefined,
          }}
        >
          <table className="w-full min-w-[700px] border-collapse text-left text-xs sm:text-sm">
            {/* Table Header */}
            <thead className="sticky top-0 z-10 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider shadow-xs">
              <tr>
                <th className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <Checkbox checked={allPageSelected} onCheckedChange={onToggleAllPage} />
                  </div>
                </th>
                <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  Flipkart Order ID
                </th>
                <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  AWB Tracking
                </th>
                <th className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  FSN Code
                </th>
                <th className="w-32 min-w-[110px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  Rack
                </th>
                <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  SKU
                </th>
                <th className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                  Customer
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="font-bold text-[#0A0E1A] dark:text-white">
                        {showPrinted
                          ? "No printed orders match your current filter."
                          : printedOrders.size > 0
                            ? `All orders in this view have been printed! (${printedCountVal} printed)`
                            : "No orders match your current search or filter."}
                      </p>
                      {printedOrders.size > 0 && !showPrinted ? (
                        <button
                          type="button"
                          onClick={onToggleShowPrinted}
                          className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                        >
                          Click here to view printed orders ({printedCountVal})
                        </button>
                      ) : showPrinted ? (
                        <button
                          type="button"
                          onClick={onToggleShowPrinted}
                          className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                        >
                          Click here to return to unprinted orders ({remainingCount})
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((item) => (
                  <tr
                    key={item.index}
                    className="transition hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06]"
                  >
                    {/* Checkbox */}
                    <td className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedRows.has(item.index)}
                          onCheckedChange={(checked) =>
                            onSelectRow(item.index, Boolean(checked))
                          }
                        />
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <span>{item.orderId}</span>
                    </td>

                    {/* AWB Tracking + Printed status */}
                    <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-medium whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.awb || "—"}
                        </span>
                        {printedOrders.has(item.pageIndex) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                            <CheckCircle2 className="h-3 w-3" /> Printed
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 
                    // =========================================================================
                    // PREVIOUS FSN CODE COLUMN
                    // (Commented out: uncomment when switching back to FSN Code from FlipkartImport)
                    // =========================================================================
                    <td className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                      {item.items && item.items.length > 0 ? (
                        <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                          {item.items.map((i, idx) => {
                            const isNotLast = idx < (item.items?.length || 1) - 1;
                            const displayFsn =
                              i.fsn ||
                              skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn ||
                              "—";
                            return (
                              <div
                                key={idx}
                                className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                              >
                                <span>{displayFsn}</span>
                                {isNotLast ? (
                                  <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span>{item.fsn || "—"}</span>
                      )}
                    </td>
                    */}

                    {/* FSN matched from DB (FlipkartImports) */}
                    <td className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                      {item.items && item.items.length > 0 ? (
                        <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                          {item.items.map((i, idx) => {
                            const isNotLast = idx < (item.items?.length || 1) - 1;
                            const displayFsn =
                              i.fsn ||
                              skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn ||
                              "—";
                            return (
                              <div
                                key={idx}
                                className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                              >
                                <span>{displayFsn}</span>
                                {isNotLast ? (
                                   <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span>{item.fsn || "—"}</span>
                      )}
                    </td>

                    {/* Rack Address matched from DB (AsinImport) */}
                    <td className="w-32 min-w-[110px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                      {item.items && item.items.length > 0 ? (
                        <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                          {item.items.map((i, idx) => {
                            const isNotLast = idx < (item.items?.length || 1) - 1;
                            const displayRack =
                              i.rackAddress ||
                              skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.rackAddress ||
                              "—";
                            return (
                              <div
                                key={idx}
                                className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                              >
                                <span className={displayRack && displayRack !== "—" && displayRack !== "Not assigned" ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}>
                                  {displayRack && displayRack !== "Not assigned" ? displayRack : "—"}
                                </span>
                                {isNotLast ? (
                                  <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={item.rackAddress && item.rackAddress !== "—" && item.rackAddress !== "Not assigned" ? "font-semibold text-emerald-700 dark:text-emerald-400" : ""}>
                          {item.rackAddress && item.rackAddress !== "Not assigned" ? item.rackAddress : "—"}
                        </span>
                      )}
                    </td>

                    {/* SKU identified from Shipping Label */}
                    <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        {item.items && item.items.length > 0 ? (
                          item.items.map((i, idx) => {
                            const isNotLast = idx < (item.items?.length || 1) - 1;
                            const itemQty = i.quantity || 1;
                            return (
                              <div
                                key={idx}
                                className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                              >
                                <span>{i.sku}</span>
                                {itemQty > 1 && (
                                  <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 ml-0.5">
                                    {itemQty} Pieces
                                  </span>
                                )}
                                {isNotLast ? (
                                  <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                ) : null}
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="break-all sm:break-normal sm:whitespace-nowrap">{item.sku || "—"}</span>
                            {Boolean(item.totalQuantity && item.totalQuantity > 1) && (
                              <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 ml-0.5">
                                {item.totalQuantity} Pieces
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.customerName || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={totalFilteredOrders}
          limit={limit}
          itemName="records"
          variant="dark"
          className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>
    </div>
  );
}


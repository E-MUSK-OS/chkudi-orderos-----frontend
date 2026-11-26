"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  RotateCw,
  Clock,
  Layers,
  X,
  Filter,
  Columns3,
  Check,
  Tag,
  Building2,
  FileText,
  Hash,
  SlidersHorizontal,
  ArrowUpDown,
  Calculator,
  PinOff,
} from "lucide-react";
import { format } from "date-fns";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { PurchaseChallanFiltersState } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";

const invoiceStatusOptions: ThemeSelectOption[] = [
  { value: "All", label: "Invoice Status" },
  { value: "Pending", label: "Pending" },
  { value: "Complete", label: "Complete" },
];

const challanForOptions: ThemeSelectOption[] = [
  { value: "All", label: "Challan For" },
  { value: "Purchase", label: "Purchase" },
  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
  { value: "Other", label: "Other" },
];

export interface ColumnDefinition {
  key: string;
  label: string;
}

export const columnDefinitions: ColumnDefinition[] = [
  { key: "no", label: "No." },
  { key: "checkbox", label: "Select" },
  { key: "challanNo", label: "Challan No." },
  { key: "lotSku", label: "Lot No. & Product SKU" },
  { key: "date", label: "Date." },
  { key: "party", label: "Party." },
  { key: "contact", label: "Contact No." },
  { key: "partyChallanNo", label: "Party Challan No." },
  { key: "totalQty", label: "Total Qty." },
  { key: "challanFor", label: "Challan For." },
  { key: "preparedBy", label: "Prepared By." },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

interface PurchaseChallanFiltersProps {
  filters: PurchaseChallanFiltersState;
  onChange: (field: keyof PurchaseChallanFiltersState, value: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onSearch: () => void;
  onReset: () => void;
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (columnKey: string) => void;
  onClearSorting?: () => void;
  onClearAggregations?: () => void;
  onResetPinning?: () => void;
}

const parseFilterDate = (str?: string): Date | undefined => {
  if (!str || !str.trim()) return undefined;
  const trimmed = str.trim();
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? undefined : d;
};

export default function PurchaseChallanFilters({
  filters,
  onChange,
  onDateRangeChange,
  onSearch,
  onReset,
  visibleColumns,
  onToggleColumn,
  onClearSorting,
  onClearAggregations,
  onResetPinning,
}: PurchaseChallanFiltersProps) {
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [skuOptions, setSkuOptions] = useState<ThemeSelectOption[]>([
    { value: "All", label: "All" },
  ]);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const tableSettingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        columnsDropdownRef.current &&
        !columnsDropdownRef.current.contains(e.target as Node)
      ) {
        setColumnsMenuOpen(false);
      }
      if (
        tableSettingsRef.current &&
        !tableSettingsRef.current.contains(e.target as Node)
      ) {
        setTableSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch SKU suggestions for Select SKU dropdown
  useEffect(() => {
    let isMounted = true;
    purchaseChallanService
      .searchSkus("")
      .then((skus) => {
        if (!isMounted) return;
        const opts: ThemeSelectOption[] = [
          { value: "All", label: "All" },
          ...skus.map((s) => ({
            value: s.sku,
            label: s.sku,
          })),
        ];
        setSkuOptions(opts);
      })
      .catch((err) => {
        console.error("Failed to fetch SKU options for filter", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleDateRange = (range: { from?: Date; to?: Date }) => {
    const startStr = range.from ? format(range.from, "yyyy-MM-dd") : "";
    const endStr = range.to ? format(range.to, "yyyy-MM-dd") : "";
    if (onDateRangeChange) {
      onDateRangeChange(startStr, endStr);
    } else {
      onChange("startDate", startStr);
      onChange("endDate", endStr);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-2.5">
        {/* Row 1: Filter Inputs & Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 2xl:flex-1 min-w-0">
          {/* 1. Funnel Icon Badge + Product SKU Search Input */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0"
              title="Filter Purchase Challans"
            >
              <Filter className="h-4 w-4" />
            </div>

            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={filters.productSku || ""}
                  onChange={(e) => onChange("productSku", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Product SKU"
                  className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
                {Boolean(filters.productSku) && (
                  <button
                    type="button"
                    onClick={() => onChange("productSku", "")}
                    className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Lot No Search Input */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.lotNo || ""}
                onChange={(e) => onChange("lotNo", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Lot No"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-mono"
              />
              {Boolean(filters.lotNo) && (
                <button
                  type="button"
                  onClick={() => onChange("lotNo", "")}
                  className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Party Search Input */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.party || filters.supplierName || ""}
                onChange={(e) => onChange("party", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Party"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              {Boolean(filters.party || filters.supplierName) && (
                <button
                  type="button"
                  onClick={() => onChange("party", "")}
                  className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 4. Party Challan No Search Input */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.partyChallanNo || ""}
                onChange={(e) => onChange("partyChallanNo", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Party Challan No"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              {Boolean(filters.partyChallanNo) && (
                <button
                  type="button"
                  onClick={() => onChange("partyChallanNo", "")}
                  className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 5. Challan For Dropdown */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              ariaLabel="Challan For"
              value={filters.challanFor || "All"}
              onChange={(val) => onChange("challanFor", val)}
              options={challanForOptions}
              className="w-full"
              buttonClassName="w-full h-9 sm:h-10 justify-between font-bold text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-[#E8C16D] whitespace-nowrap px-3"
              menuClassName="min-w-[185px] w-max shadow-xl"
              icon={<Layers className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
            />
          </div>

          {/* 6. Invoice Status Dropdown */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              ariaLabel="Invoice Status"
              value={filters.invoiceStatus || "All"}
              onChange={(val) => onChange("invoiceStatus", val)}
              options={invoiceStatusOptions}
              className="w-full"
              buttonClassName="w-full h-9 sm:h-10 justify-between font-bold text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-[#E8C16D] whitespace-nowrap px-3"
              menuClassName="min-w-[170px] w-max shadow-xl"
              icon={<Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
            />
          </div>

          {/* 7. Select Date Picker */}
          <div className="min-w-0">
            <DateRangePicker
              from={parseFilterDate(filters.startDate)}
              to={parseFilterDate(filters.endDate)}
              onChange={handleDateRange}
              onClear={() => handleDateRange({ from: undefined, to: undefined })}
              placeholder="Select Date"
              className="w-full"
              triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-10 py-0 px-3 text-xs sm:text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
            />
          </div>

          {/* 8. Select SKU Dropdown */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              ariaLabel="Select SKU"
              placeholder="Select SKU"
              value={filters.selectedSku || "All"}
              onChange={(val) => onChange("selectedSku", val)}
              options={skuOptions}
              className="w-full"
              buttonClassName="w-full h-9 sm:h-10 justify-between font-bold text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-[#E8C16D] whitespace-nowrap px-3"
              menuClassName="min-w-[240px] w-max max-w-[420px] shadow-2xl"
              icon={<Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
            />
          </div>
        </div>

        {/* Row 2: Global Search, Columns, Settings, Reset */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full 2xl:w-auto 2xl:shrink-0 2xl:flex-nowrap">
          {/* Global search input */}
          <div className="relative w-full sm:flex-1 2xl:flex-none 2xl:w-44">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <Search className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] shrink-0" />
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => onChange("search", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Global search..."
                className="w-full bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              {Boolean(filters.search) && (
                <button
                  type="button"
                  onClick={() => onChange("search", "")}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">

            {/* Columns Visibility Dropdown */}
            {onToggleColumn && visibleColumns && (
              <div className="relative" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
                  className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer"
                  title="Toggle visible columns"
                >
                  <Columns3 className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Columns</span>
                </button>

                {columnsMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 p-2 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1">
                      Toggle Columns
                    </div>
                    <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                      {columnDefinitions.map((col) => {
                        const isVisible = visibleColumns[col.key] !== false;
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => onToggleColumn(col.key)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                          >
                            <span>{col.label}</span>
                            <div
                              className={`grid h-4 w-4 place-items-center rounded border ${
                                isVisible
                                  ? "bg-[#E8C16D] border-[#E8C16D] text-black"
                                  : "border-slate-300 dark:border-white/20"
                              }`}
                            >
                              {isVisible && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Table Settings Dropdown Menu (Clear Sorting, Clear Filters, Clear Aggregations, Column Pinning) */}
            <div className="relative" ref={tableSettingsRef}>
              <button
                type="button"
                onClick={() => setTableSettingsOpen(!tableSettingsOpen)}
                className={`grid h-9 sm:h-10 w-9 sm:w-10 place-items-center rounded-xl border transition-all shadow-2xs cursor-pointer ${
                  tableSettingsOpen
                    ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                }`}
                title="Table Settings"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>

              {tableSettingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 p-1.5 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Section 1: Table Settings */}
                  <div className="px-3 pt-2 pb-1 text-xs font-bold text-slate-900 dark:text-white">
                    Table Settings
                  </div>
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearSorting?.();
                        setTableSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                      <span>Clear All Sorting</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onReset();
                        setTableSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                      <span>Clear All Filters</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClearAggregations?.();
                        setTableSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Calculator className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                      <span>Clear Aggregations</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.08]" />

                  {/* Section 2: Column Pinning */}
                  <div className="px-3 pt-1 pb-1 text-xs font-bold text-slate-900 dark:text-white">
                    Column Pinning
                  </div>
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResetPinning?.();
                        setTableSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <PinOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                      <span>Reset All Pinning</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center h-9 sm:h-10 w-9 sm:w-10 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all shadow-2xs active:scale-[0.98] cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

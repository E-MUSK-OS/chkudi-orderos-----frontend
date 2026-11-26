"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  RotateCw,
  Columns3,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Calculator,
  PinOff,
  X,
  Hash,
  Building2,
  FileText,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { DebitNoteFilterState } from "../types/purchaseDebitNote.types";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { purchaseChallanService } from "@/components/Dashboard/Purchase/PurchaseChallan/services/purchaseChallan.service";

interface DebitNoteFiltersProps {
  filters: DebitNoteFilterState;
  onChange: (key: keyof DebitNoteFilterState, value: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onSearch: () => void;
  onReset: () => void;
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (columnKey: string) => void;
  onClearSorting?: () => void;
  onClearAggregations?: () => void;
  onResetPinning?: () => void;
}

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "All", label: "Invoice Type" },
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "URD Tax Invoice", label: "URD Tax Invoice" },
  { value: "Bill of Supply", label: "Bill of Supply" },
  { value: "Export Invoice", label: "Export Invoice" },
];

const columnDefinitions = [
  { key: "debitNoteNo", label: "Debit Note No." },
  { key: "lotOrSku", label: "Lot No. & Product SKU." },
  { key: "date", label: "Date." },
  { key: "partyName", label: "Party Name." },
  { key: "quantity", label: "Quantity." },
  { key: "netAmount", label: "Net Amount." },
  { key: "invoiceType", label: "Invoice Type." },
  { key: "preparedBy", label: "Prepared By." },
  { key: "actions", label: "Actions" },
];

function parseFilterDate(str?: string): Date | undefined {
  if (!str || !str.trim()) return undefined;
  const parts = str.trim().split("-");
  if (parts.length !== 3) return undefined;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  return isNaN(dt.getTime()) ? undefined : dt;
}

export default function DebitNoteFilters({
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
}: DebitNoteFiltersProps) {
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [skuOptions, setSkuOptions] = useState<ThemeSelectOption[]>([
    { value: "All", label: "Select SKU" },
  ]);

  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const tableSettingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(target)) {
        setColumnsMenuOpen(false);
      }
      if (tableSettingsRef.current && !tableSettingsRef.current.contains(target)) {
        setTableSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    purchaseChallanService
      .searchSkus("")
      .then((list) => {
        if (!isMounted) return;
        const uniqueSkus = Array.from(
          new Set(
            (list || [])
              .map((item) => String(item.sku || "").trim())
              .filter(Boolean)
          )
        );
        setSkuOptions([
          { value: "All", label: "Select SKU" },
          ...uniqueSkus.map((sku) => ({ value: sku, label: sku })),
        ]);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 2xl:flex-1 min-w-0">
          {/* 1. Funnel Icon + Product SKU */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0"
              title="Filter Debit Notes"
            >
              <Filter className="h-4 w-4" />
            </div>

            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D]">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={filters.productSku || ""}
                  onChange={(e) => onChange("productSku", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Product SKU"
                  className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none"
                />
                {Boolean(filters.productSku) && (
                  <button type="button" onClick={() => onChange("productSku", "")} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Lot No */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D]">
              <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.lotNo || ""}
                onChange={(e) => onChange("lotNo", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Lot No"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none font-mono"
              />
              {Boolean(filters.lotNo) && (
                <button type="button" onClick={() => onChange("lotNo", "")} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Party */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D]">
              <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.party || ""}
                onChange={(e) => onChange("party", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Party"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none"
              />
              {Boolean(filters.party) && (
                <button type="button" onClick={() => onChange("party", "")} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 4. Debit Note No */}
          <div className="relative min-w-0">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D]">
              <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={filters.debitNoteNo || ""}
                onChange={(e) => onChange("debitNoteNo", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Debit Note No"
                className="w-full min-w-0 bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none font-mono"
              />
              {Boolean(filters.debitNoteNo) && (
                <button type="button" onClick={() => onChange("debitNoteNo", "")} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* 5. Invoice Type */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              ariaLabel="Invoice Type"
              value={filters.invoiceType || "All"}
              onChange={(val) => onChange("invoiceType", val)}
              options={invoiceTypeOptions}
              className="w-full"
              buttonClassName="w-full h-9 sm:h-10 justify-between font-bold text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-[#E8C16D] whitespace-nowrap px-3"
              menuClassName="min-w-[185px] w-max shadow-xl"
              icon={<Layers className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
            />
          </div>

          {/* 6. Select Date */}
          <div className="col-span-1 lg:col-span-2 xl:col-span-1 min-w-0">
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

          {/* 7. Select SKU */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 min-w-0">
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

        {/* Right Section: Global Search, Columns, Settings, Reset */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full 2xl:w-auto 2xl:shrink-0 2xl:flex-nowrap">
          <div className="relative w-full sm:flex-1 2xl:flex-none 2xl:w-48">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2.5 py-1.5 h-9 sm:h-10 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D]">
              <Search className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] shrink-0" />
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => onChange("search", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Global search..."
                className="w-full bg-transparent text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none"
              />
              {Boolean(filters.search) && (
                <button type="button" onClick={() => onChange("search", "")} className="text-slate-400 hover:text-red-500 cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">

            {onToggleColumn && visibleColumns && (
              <div className="relative" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
                  className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer"
                >
                  <Columns3 className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Columns</span>
                </button>
                {columnsMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 p-2 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-xl z-50">
                    <div className="text-[11px] font-bold text-slate-400 uppercase px-2 py-1">
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
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer text-left"
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

            <div className="relative" ref={tableSettingsRef}>
              <button
                type="button"
                onClick={() => setTableSettingsOpen(!tableSettingsOpen)}
                className="grid h-9 sm:h-10 w-9 sm:w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-2xs cursor-pointer"
                title="Table Settings"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {tableSettingsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 p-1.5 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50">
                  <div className="px-3 pt-2 pb-1 text-xs font-bold text-slate-900 dark:text-white">
                    Table Settings
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClearSorting?.();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    <span>Clear All Sorting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
                  >
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>Clear All Filters</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAggregations?.();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
                  >
                    <Calculator className="h-3.5 w-3.5 text-slate-400" />
                    <span>Clear Aggregations</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetPinning?.();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
                  >
                    <PinOff className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reset All Pinning</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center h-9 sm:h-10 w-9 sm:w-10 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all shadow-2xs cursor-pointer shrink-0"
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

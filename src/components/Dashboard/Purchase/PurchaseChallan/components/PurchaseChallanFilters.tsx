"use client";

import React from "react";
import { Search, RotateCw, Clock, Layers, X, Warehouse } from "lucide-react";
import { format } from "date-fns";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { PurchaseChallanFiltersState } from "../types/purchaseChallan.types";

const invoiceStatusOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Invoice Status" },
  { value: "Pending", label: "Pending" },
  { value: "Complete", label: "Complete" },
];

const challanForOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Categories" },
  { value: "Purchase", label: "Purchase" },
  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
  { value: "Other", label: "Other" },
];

const stockInFilterOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Warehouses" },
  { value: "General", label: "General" },
  { value: "COCOBLU", label: "COCOBLU" },
  { value: "MYNTRA", label: "MYNTRA" },
];

interface PurchaseChallanFiltersProps {
  filters: PurchaseChallanFiltersState;
  onChange: (field: keyof PurchaseChallanFiltersState, value: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onSearch: () => void;
  onReset: () => void;
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
}: PurchaseChallanFiltersProps) {
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
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Controls Container */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap 2xl:flex-nowrap lg:items-center">
          {/* 1. Single Unified Search */}
          <div className="relative flex-1 min-w-[220px] sm:min-w-[280px]">
            <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 py-2 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 h-10 sm:h-11">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={filters.search || ""}
                onChange={(e) => onChange("search", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search all columns (Challan No, Supplier, Party Challan, SKU, Status...)"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              {Boolean(filters.search) && (
                <button
                  type="button"
                  onClick={() => onChange("search", "")}
                  className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Single Date Range Picker */}
          <div className="w-full sm:w-auto">
            <DateRangePicker
              from={parseFilterDate(filters.startDate)}
              to={parseFilterDate(filters.endDate)}
              onChange={handleDateRange}
              onClear={() => handleDateRange({ from: undefined, to: undefined })}
              placeholder="Select Date Range"
            />
          </div>

          {/* 3. Invoice Status Dropdown */}
          <div className="w-full sm:w-44">
            <ThemeSelectDropdown
              ariaLabel="Filter by Invoice Status"
              value={filters.invoiceStatus}
              onChange={(val) => onChange("invoiceStatus", val)}
              options={invoiceStatusOptions}
              className="w-full"
              buttonClassName="w-full h-10 sm:h-11 justify-between font-bold text-xs sm:text-sm rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#B88728] dark:text-[#E8C16D]"
              menuClassName="w-full min-w-[190px]"
              icon={<Clock className="h-3.5 w-3.5" />}
            />
          </div>

          {/* 4. Challan For Dropdown */}
          <div className="w-full sm:w-44">
            <ThemeSelectDropdown
              ariaLabel="Filter by Challan For"
              value={filters.challanFor}
              onChange={(val) => onChange("challanFor", val)}
              options={challanForOptions}
              className="w-full"
              buttonClassName="w-full h-10 sm:h-11 justify-between font-bold text-xs sm:text-sm rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#B88728] dark:text-[#E8C16D]"
              menuClassName="w-full min-w-[190px]"
              icon={<Layers className="h-3.5 w-3.5" />}
            />
          </div>

          {/* 5. Stock In Dropdown */}
          <div className="w-full sm:w-44">
            <ThemeSelectDropdown
              ariaLabel="Filter by Stock In"
              value={filters.stockIn}
              onChange={(val) => onChange("stockIn", val)}
              options={stockInFilterOptions}
              className="w-full"
              buttonClassName="w-full h-10 sm:h-11 justify-between font-bold text-xs sm:text-sm rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#B88728] dark:text-[#E8C16D]"
              menuClassName="w-full min-w-[190px]"
              icon={<Warehouse className="h-3.5 w-3.5" />}
            />
          </div>
        </div>

        {/* Action Buttons: Reset & Filter */}
        <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-[#E7E0D2] dark:border-white/[0.06] lg:border-t-0">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer h-10 sm:h-11"
            title="Reset all filters"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
              <RotateCw className="h-3.5 w-3.5" />
            </div>
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onSearch}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer h-10 sm:h-11"
          >
            <Search size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Search,
  Columns3,
  RotateCcw,
  Check,
} from "lucide-react";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { format } from "date-fns";

export interface ColumnOption {
  id: string;
  label: string;
  visible: boolean;
}

interface PurchaseOrderFiltersProps {
  sku: string;
  onSkuChange: (val: string) => void;
  lotNo: string;
  onLotNoChange: (val: string) => void;
  party: string;
  onPartyChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  columns: ColumnOption[];
  onToggleColumn: (id: string) => void;
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

const statusOptions: ThemeSelectOption[] = [
  { value: "All", label: "Status (All)" },
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function PurchaseOrderFilters({
  sku,
  onSkuChange,
  lotNo,
  onLotNoChange,
  party,
  onPartyChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onDateRangeChange,
  search,
  onSearchChange,
  onClearFilters,
  onRefresh,
  columns,
  onToggleColumn,
}: PurchaseOrderFiltersProps) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on outside click

  const handleDateRange = (range: { from?: Date; to?: Date }) => {
    const startStr = range.from ? format(range.from, "yyyy-MM-dd") : "";
    const endStr = range.to ? format(range.to, "yyyy-MM-dd") : "";
    if (onDateRangeChange) {
      onDateRangeChange(startStr, endStr);
    } else {
      onStartDateChange(startStr);
      onEndDateChange(endStr);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] p-3.5 sm:p-4 shadow-xs text-xs">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-2.5">
        {/* Left Filter Inputs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 2xl:flex-1 min-w-0">
          {/* 1. Funnel Icon + Product SKU Search */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 shrink-0">
              <Filter className="w-3.5 h-3.5" />
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sku}
                onChange={(e) => onSkuChange(e.target.value)}
                placeholder="Product SKU"
                className="h-8 sm:h-9 w-full min-w-0 pl-8 pr-2.5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] text-xs font-mono"
              />
            </div>
          </div>

          {/* 2. Lot No Search */}
          <div className="relative min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={lotNo}
              onChange={(e) => onLotNoChange(e.target.value)}
              placeholder="Lot No"
              className="h-8 sm:h-9 w-full min-w-0 pl-8 pr-2.5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] text-xs font-mono"
            />
          </div>

          {/* 3. Party Search */}
          <div className="relative min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={party}
              onChange={(e) => onPartyChange(e.target.value)}
              placeholder="Party"
              className="h-8 sm:h-9 w-full min-w-0 pl-8 pr-2.5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] text-xs"
            />
          </div>

          {/* 4. Status Dropdown */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              value={status || "All"}
              onChange={onStatusChange}
              options={statusOptions}
              className="w-full"
              buttonClassName="w-full h-8 sm:h-9 px-3 rounded-full border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white text-xs font-semibold"
            />
          </div>

          {/* 5. Date Range Picker matching Purchase Challan */}
          <div className="col-span-2 lg:col-span-1 min-w-0">
            <DateRangePicker
              from={parseFilterDate(startDate)}
              to={parseFilterDate(endDate)}
              onChange={handleDateRange}
              onClear={() => handleDateRange({ from: undefined, to: undefined })}
              placeholder="Select Date"
              className="w-full"
              triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-8 sm:h-9 rounded-full px-3 py-0 text-xs sm:text-xs"
            />
          </div>
        </div>

        {/* Right Actions: Global Search, Columns dropdown, Refresh button */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full 2xl:w-auto 2xl:shrink-0 2xl:flex-nowrap">
          {/* Global search */}
          <div className="relative w-full sm:flex-1 2xl:flex-none 2xl:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Global search..."
              className="h-8 sm:h-9 w-full pl-8 pr-2.5 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">

          {/* Columns Visibility Dropdown */}
          <div className="relative" ref={columnsRef}>
            <button
              type="button"
              onClick={() => setColumnsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 font-bold hover:border-[#E8C16D] transition-colors cursor-pointer"
            >
              <Columns3 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Columns</span>
            </button>

            {columnsOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-[#141A29] border border-slate-200 dark:border-white/[0.08] shadow-lg p-2 z-50 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Toggle Columns
                </p>
                {columns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onToggleColumn(col.id)}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {col.label}
                    </span>
                    {col.visible && (
                      <Check className="w-3.5 h-3.5 text-[#E8C16D]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset All Filters Button */}
          <button
            type="button"
            onClick={onClearFilters}
            title="Reset All Filters"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#E8C16D] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

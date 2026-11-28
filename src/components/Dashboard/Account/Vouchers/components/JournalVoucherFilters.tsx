"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Columns3,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Calculator,
  PinOff,
  RotateCw,
} from "lucide-react";
import { format } from "date-fns";
import DateRangePicker from "@/components/ui/DateRangePicker";
import type { JournalVoucherFilterState } from "../types/journalVoucher.types";

export const journalVoucherColumns = [
  { key: "no", label: "No." },
  { key: "voucherNo", label: "J. Voucher No." },
  { key: "date", label: "Date." },
  { key: "creditAccountName", label: "Credit Account Name" },
  { key: "debitAccountName", label: "Debit Account Name" },
  { key: "narration", label: "Narration" },
  { key: "refNo", label: "Ref No" },
  { key: "amount", label: "Amount." },
  { key: "actions", label: "Actions" },
];

interface JournalVoucherFiltersProps {
  filters: JournalVoucherFilterState;
  onChange: (field: keyof JournalVoucherFilterState, value: string) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onReset: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: string) => void;
  onClearSorting: () => void;
  onResetPinning: () => void;
  onToggleAggregations: () => void;
  showAggregations: boolean;
}

const parseFilterDate = (str?: string): Date | undefined => {
  if (!str || !str.trim()) return undefined;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export default function JournalVoucherFilters({
  filters,
  onChange,
  onDateRangeChange,
  onReset,
  visibleColumns,
  onToggleColumn,
  onClearSorting,
  onResetPinning,
  onToggleAggregations,
  showAggregations,
}: JournalVoucherFiltersProps) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm">
      {/* Left Filter Controls: Global Search -> Date */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {/* Global Search */}
        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
            placeholder="Global search..."
            className="w-full h-10 pl-9 pr-3.5 text-xs font-medium rounded-2xl bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs hover:border-[#E8C16D] focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/30 transition-all"
          />
        </div>

        {/* Date Range Picker */}
        <div className="w-full sm:w-[260px]">
          <DateRangePicker
            from={parseFilterDate(filters.startDate)}
            to={parseFilterDate(filters.endDate)}
            onChange={(range) => {
              onDateRangeChange(
                range.from ? format(range.from, "yyyy-MM-dd") : "",
                range.to ? format(range.to, "yyyy-MM-dd") : ""
              );
            }}
            onClear={() => onDateRangeChange("", "")}
            placeholder="Date"
            triggerClassName="!min-w-0 w-full !h-10 !py-0 text-xs"
          />
        </div>
      </div>

      {/* Right Columns & Table Options */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        {/* Columns Toggle */}
        <div ref={columnsRef} className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold rounded-2xl bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.04] transition-colors shadow-xs"
          >
            <Columns3 className="h-3.5 w-3.5 text-[#6A4D1D] dark:text-[#E8C16D]" />
            <span>Columns</span>
          </button>

          {columnsOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-xl dark:shadow-black/50 p-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                Visible Columns
              </div>
              {journalVoucherColumns.map((col) => {
                const checked = visibleColumns[col.key] !== false;
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => onToggleColumn(col.key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] transition-colors"
                  >
                    <span>{col.label}</span>
                    {checked && <Check className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Settings */}
        <div ref={settingsRef} className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.04] transition-colors shadow-xs"
            title="Table Options"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-xl dark:shadow-black/50 p-1.5 z-50">
              <button
                type="button"
                onClick={() => {
                  onClearSorting();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                Clear Sorting
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleAggregations();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
              >
                <Calculator className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                {showAggregations ? "Hide Summary Row" : "Show Summary Row"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetPinning();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
              >
                <PinOff className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                Clear Pinning
              </button>
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
              >
                <RotateCw className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

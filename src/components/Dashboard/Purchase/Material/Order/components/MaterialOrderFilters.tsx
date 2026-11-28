"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Search,
  Columns3,
  RotateCw,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Calculator,
  PinOff,
  Building2,
} from "lucide-react";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { format } from "date-fns";

export interface MaterialOrderColumnOption {
  id: string;
  label: string;
  visible: boolean;
}

interface MaterialOrderFiltersProps {
  party: string;
  onPartyChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  columns: MaterialOrderColumnOption[];
  onToggleColumn: (colId: string) => void;
  onClearFilters: () => void;
  onClearSorting?: () => void;
  onToggleAggregations?: () => void;
}

function parseFilterDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

const statusOptions: ThemeSelectOption[] = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Complete", label: "Complete" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function MaterialOrderFilters({
  party,
  onPartyChange,
  status,
  onStatusChange,
  startDate,
  endDate,
  onDateRangeChange,
  search,
  onSearchChange,
  columns,
  onToggleColumn,
  onClearFilters,
  onClearSorting,
  onToggleAggregations,
}: MaterialOrderFiltersProps) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateRange = (range: { from?: Date; to?: Date }) => {
    const startStr = range.from ? format(range.from, "yyyy-MM-dd") : "";
    const endStr = range.to ? format(range.to, "yyyy-MM-dd") : "";
    onDateRangeChange(startStr, endStr);
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
        {/* Row 1: 3 Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 xl:flex-1 min-w-0">
          {/* 1. Funnel Icon + Party */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <Filter className="w-4 h-4" />
            </div>

            <div className="relative flex-1 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={party}
                onChange={(e) => onPartyChange(e.target.value)}
                placeholder="Party"
                className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          {/* 2. Status */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              value={status}
              onChange={onStatusChange}
              options={statusOptions}
              placeholder="Status"
              showAllLabel
              icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              className="w-full"
              buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                !status
                  ? "font-normal text-slate-400 dark:text-slate-400"
                  : "font-semibold text-[#0A0E1A] dark:text-white"
              }`}
            />
          </div>

          {/* 3. Order Date */}
          <div className="col-span-2 sm:col-span-1 min-w-0">
            <DateRangePicker
              from={parseFilterDate(startDate)}
              to={parseFilterDate(endDate)}
              onChange={handleDateRange}
              onClear={() => handleDateRange({ from: undefined, to: undefined })}
              placeholder="Order Date"
              className="w-full"
              triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs sm:text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
            />
          </div>
        </div>

        {/* Row 2: Global Search, Columns, Settings, Reset */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full xl:w-auto xl:shrink-0 xl:flex-nowrap">
          <div className="relative w-full sm:flex-1 xl:flex-none xl:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Global search..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
            {/* Columns */}
            <div className="relative" ref={columnsRef}>
              <button
                type="button"
                onClick={() => setColumnsOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] cursor-pointer"
              >
                <Columns3 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Columns</span>
              </button>

              {columnsOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 p-2 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Toggle Columns
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {columns.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => onToggleColumn(col.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer text-left"
                      >
                        <span>{col.label}</span>
                        <div
                          className={`grid h-4 w-4 place-items-center rounded border ${
                            col.visible
                              ? "bg-[#E8C16D] border-[#E8C16D] text-black"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {col.visible && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Table Settings */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] cursor-pointer"
                title="Table Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-1.5 shadow-xl z-40">
                  {onClearSorting && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearSorting();
                        setSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Clear Sorting</span>
                    </button>
                  )}
                  {onToggleAggregations && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleAggregations();
                        setSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Toggle Sum Row</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilters();
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={onClearFilters}
              className="grid h-9 w-9 place-items-center rounded-full border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              title="Reset Filters"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

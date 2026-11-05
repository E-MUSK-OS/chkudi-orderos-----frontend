"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, ChevronDown, RotateCcw, Check } from "lucide-react";
import { SalariedEmployeeFilterState } from "../types/salariedEmployee.types";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";

interface SalariedEmployeeFilterBarProps {
  filters: SalariedEmployeeFilterState;
  onFilterChange: (updates: Partial<SalariedEmployeeFilterState>) => void;
  onResetFilters: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (colKey: string) => void;
  availableColumns: { key: string; label: string }[];
}

export default function SalariedEmployeeFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  visibleColumns,
  onToggleColumn,
  availableColumns,
}: SalariedEmployeeFilterBarProps) {
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [columnsOpenUpward, setColumnsOpenUpward] = useState(false);

  const handleToggleColumns = () => {
    if (!columnsDropdownOpen && columnsDropdownRef.current) {
      const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(columnsDropdownRef.current);
      setColumnsOpenUpward(spaceBelow < 320 && spaceAbove > spaceBelow);
    }
    setColumnsDropdownOpen((prev) => !prev);
  };
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        columnsDropdownRef.current &&
        !columnsDropdownRef.current.contains(e.target as Node)
      ) {
        setColumnsDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setColumnsDropdownOpen(false);
      }
    }
    if (columnsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [columnsDropdownOpen]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full pt-1">
      {/* Left side: Filter toggle & Name Search */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Filter icon button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-600 hover:text-black dark:border-white/[0.08] dark:bg-[#161B24] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
          title="Reset Filters"
        >
          <Filter size={15} />
        </button>

        {/* Name Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.employeeName}
            onChange={(e) => onFilterChange({ employeeName: e.target.value, page: 1 })}
            placeholder="Name"
            className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B24] dark:border-white/[0.08] dark:text-white dark:placeholder-slate-400 dark:focus:border-white/[0.2] outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Right side: Global search & Columns dropdown */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Global Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[280px]">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Global search..."
            className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 focus:border-[#E8C16D] dark:bg-[#161B24] dark:border-white/[0.08] dark:text-white dark:placeholder-slate-400 dark:focus:border-white/[0.2] outline-none transition-all shadow-inner"
          />
        </div>

        {/* Columns Toggle Dropdown matching Image 2 */}
        <div className="relative" ref={columnsDropdownRef}>
          <button
            type="button"
            aria-label="Toggle Columns"
            onClick={handleToggleColumns}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-3.5 h-10 text-xs font-bold transition-all shadow-xs outline-none select-none cursor-pointer",
              "bg-white text-slate-700 dark:bg-[#131622] dark:text-slate-200",
              columnsDropdownOpen
                ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 text-[#0A0E1A] dark:border-[#F5C451] dark:ring-[#F5C451]/30 dark:text-white"
                : "border-[#E7E0D2] hover:border-[#E8C16D]/50 hover:bg-slate-50 dark:border-white/[0.08] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Columns</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[#F5C451] transition-transform duration-200",
                columnsDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {columnsDropdownOpen && (
            <div className={cn(
              "absolute right-0 z-50 w-56 rounded-2xl border border-[#E7E0D2] bg-white p-2 shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-2xl dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-100",
              columnsOpenUpward ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
            )}>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] mb-1">
                TOGGLE COLUMNS
              </div>
              <div
                className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {availableColumns.map((col) => {
                  const isChecked = visibleColumns[col.key] !== false;
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => onToggleColumn(col.key)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 dark:text-slate-100 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <span>{col.label}</span>
                      {isChecked && (
                        <Check className="h-3.5 w-3.5 text-[#F5C451] stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-600 hover:text-black dark:border-white/[0.08] dark:bg-[#161B24] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
          title="Reset All"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

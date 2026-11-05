"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import {
  EmployeeFilterState,
  EmployeeColumnConfig,
} from "../types/employee.types";

interface EmployeeProfileFilterBarProps {
  filters: EmployeeFilterState;
  onFilterChange: (updates: Partial<EmployeeFilterState>) => void;
  onResetFilters: () => void;
  columns: EmployeeColumnConfig[];
  onToggleColumn: (key: string) => void;
}

export const DEPARTMENT_OPTIONS: ThemeSelectOption[] = [
  { value: "all", label: "Department (All)" },
  { value: "Admin", label: "Admin" },
  { value: "Cutting", label: "Cutting" },
  { value: "Stitching", label: "Stitching" },
  { value: "Finishing", label: "Finishing" },
  { value: "Store", label: "Store" },
  { value: "Inventory", label: "Inventory" },
  { value: "Computer Operator", label: "Computer Operator" },
  { value: "Other", label: "Other" },
];

export const STATUS_OPTIONS: ThemeSelectOption[] = [
  { value: "all", label: "Status (All)" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function EmployeeProfileFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  columns,
  onToggleColumn,
}: EmployeeProfileFilterBarProps) {
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [columnsOpenUpward, setColumnsOpenUpward] = useState(false);

  const handleToggleColumns = () => {
    if (!columnsDropdownOpen && dropdownRef.current) {
      const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(dropdownRef.current);
      setColumnsOpenUpward(spaceBelow < 320 && spaceAbove > spaceBelow);
    }
    setColumnsDropdownOpen((prev) => !prev);
  };
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close columns dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setColumnsDropdownOpen(false);
      }
    }
    if (columnsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnsDropdownOpen]);

  // Close columns dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setColumnsDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.employeeName) ||
    Boolean(filters.machineCode) ||
    (Boolean(filters.status) && filters.status !== "all") ||
    (Boolean(filters.department) && filters.department !== "all");

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm">
      {/* Left side filters matching Ledger Book pill style */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Employee Name Pill Search */}
        <div className="relative flex-1 min-w-[190px] max-w-xs">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={filters.employeeName}
            onChange={(e) =>
              onFilterChange({ employeeName: e.target.value, page: 1 })
            }
            placeholder="Employee Name"
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {filters.employeeName && (
            <button
              type="button"
              onClick={() => onFilterChange({ employeeName: "", page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Machine Code Filter */}
        <div className="relative min-w-[150px] max-w-[180px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={filters.machineCode}
            onChange={(e) =>
              onFilterChange({ machineCode: e.target.value, page: 1 })
            }
            placeholder="Machine Code."
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {filters.machineCode && (
            <button
              type="button"
              onClick={() => onFilterChange({ machineCode: "", page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown Pill */}
        <ThemeSelectDropdown
          ariaLabel="Filter by Status"
          value={filters.status || "all"}
          onChange={(val) => onFilterChange({ status: val, page: 1 })}
          options={STATUS_OPTIONS}
          buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
          menuClassName="w-44 rounded-2xl"
        />

        {/* Department Dropdown Pill */}
        <ThemeSelectDropdown
          ariaLabel="Filter by Department"
          value={filters.department || "all"}
          onChange={(val) => onFilterChange({ department: val, page: 1 })}
          options={DEPARTMENT_OPTIONS}
          buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
          menuClassName="w-56 rounded-2xl"
        />

        {/* Reset Filters Pill matching Ledger Book */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shadow-xs"
            title="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side search & column controls matching Ledger Book */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Global Search Pill Input */}
        <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ search: e.target.value, page: 1 })
            }
            placeholder="Global search..."
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "", page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Columns Dropdown Pill Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Toggle Columns"
            onClick={handleToggleColumns}
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none",
              "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-white dark:hover:border-[#E8C16D]",
              columnsDropdownOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#E8C16D] dark:ring-[#E8C16D]/30"
            )}
          >
            <div className="grid h-4 w-4 place-items-center text-[#B88728] dark:text-[#E8C16D] shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <span>Columns</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${
                columnsDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Columns Dropdown Menu */}
          {columnsDropdownOpen && (
            <div className={cn(
              "absolute right-0 z-50 w-56 rounded-2xl border border-[#E7E0D2] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50",
              columnsOpenUpward ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
            )}>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] mb-1">
                Display Columns
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
                {columns.map((col) => {
                  const isActions = col.key === "actions";
                  return (
                    <button
                      key={col.key}
                      type="button"
                      disabled={isActions}
                      onClick={() => !isActions && onToggleColumn(col.key)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left",
                        isActions
                          ? "opacity-50 cursor-not-allowed text-slate-400"
                          : "hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.06] dark:text-slate-200 cursor-pointer"
                      )}
                    >
                      <span>{col.label}</span>
                      {col.visible && (
                        <Check className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

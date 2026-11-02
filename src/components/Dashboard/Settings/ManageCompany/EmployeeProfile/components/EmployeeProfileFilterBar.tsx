"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Filter,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import { cn } from "@/lib/utils";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 py-2">
      {/* Left side filters matching Ledger Book UI */}
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        {/* Employee Name Search with Filter Icon */}
        <div className="relative flex items-center min-w-[190px] sm:min-w-[220px]">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Filter size={14} />
          </div>
          <input
            type="text"
            value={filters.employeeName}
            onChange={(e) =>
              onFilterChange({ employeeName: e.target.value, page: 1 })
            }
            placeholder="Employee Name"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white text-slate-900 placeholder-slate-400 border border-[#E7E0D2] focus:outline-none focus:border-[#E8C16D] dark:bg-[#131622] dark:text-white dark:placeholder-slate-500 dark:border-white/[0.08] dark:focus:border-white/20 transition-all shadow-inner"
          />
        </div>

        {/* Machine Code Filter */}
        <div className="relative flex items-center min-w-[150px] sm:min-w-[170px]">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={filters.machineCode}
            onChange={(e) =>
              onFilterChange({ machineCode: e.target.value, page: 1 })
            }
            placeholder="Machine Code."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white text-slate-900 placeholder-slate-400 border border-[#E7E0D2] focus:outline-none focus:border-[#E8C16D] dark:bg-[#131622] dark:text-white dark:placeholder-slate-500 dark:border-white/[0.08] dark:focus:border-white/20 transition-all shadow-inner"
          />
        </div>

        {/* Status Dropdown - Clean dark style matching Account Head */}
        <div className="relative">
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={filters.status || "all"}
            onChange={(val) => onFilterChange({ status: val, page: 1 })}
            options={STATUS_OPTIONS}
            buttonClassName="h-9 px-3.5 text-xs font-semibold rounded-xl border border-[#E7E0D2] bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#131622] dark:text-slate-200 dark:border-white/[0.08]"
            menuClassName="w-44"
          />
        </div>

        {/* Department Dropdown - Clean dark style matching Account Head */}
        <div className="relative">
          <ThemeSelectDropdown
            ariaLabel="Filter by Department"
            value={filters.department || "all"}
            onChange={(val) => onFilterChange({ department: val, page: 1 })}
            options={DEPARTMENT_OPTIONS}
            buttonClassName="h-9 px-3.5 text-xs font-semibold rounded-xl border border-[#E7E0D2] bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#131622] dark:text-slate-200 dark:border-white/[0.08]"
            menuClassName="w-56"
          />
        </div>

        {/* Clear Filters button matching Ledger Book */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-black bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.06] transition-all cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side search & column controls matching Ledger Book */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Global Search */}
        <div className="relative flex items-center min-w-[180px] sm:min-w-[220px]">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ search: e.target.value, page: 1 })
            }
            placeholder="Global search..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white text-slate-900 placeholder-slate-400 border border-[#E7E0D2] focus:outline-none focus:border-[#E8C16D] dark:bg-[#131622] dark:text-white dark:placeholder-slate-500 dark:border-white/[0.08] dark:focus:border-white/20 transition-all shadow-inner"
          />
        </div>

        {/* Columns Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Toggle Columns"
            onClick={() => setColumnsDropdownOpen((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 h-9 text-xs font-bold transition-all shadow-xs outline-none select-none cursor-pointer",
              "bg-white text-slate-700 dark:bg-[#131622] dark:text-slate-200",
              columnsDropdownOpen
                ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 text-[#0A0E1A] dark:border-[#F5C451] dark:ring-[#F5C451]/30 dark:text-white"
                : "border-[#E7E0D2] hover:border-[#E8C16D]/50 hover:bg-slate-50 dark:border-white/[0.08] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Columns</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
                columnsDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Columns Dropdown Menu matching Ledger Book */}
          {columnsDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-[#E7E0D2] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] mb-1">
                Toggle Columns
              </div>
              <div
                className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {columns.map((col) => {
                  if (col.key === "actions") return null;
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => onToggleColumn(col.key)}
                      className={`
                        w-full
                        flex
                        items-center
                        justify-between
                        gap-2.5
                        rounded-xl
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        transition-all
                        cursor-pointer
                        text-left
                        ${
                          col.visible
                            ? "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                            : "text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
                        }
                      `}
                    >
                      <span className="truncate">{col.label}</span>
                      {col.visible && (
                        <Check className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] shrink-0 stroke-[2.5]" />
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

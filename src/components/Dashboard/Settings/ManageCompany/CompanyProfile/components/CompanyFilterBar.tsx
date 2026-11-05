"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, SlidersHorizontal, LayoutGrid, Table } from "lucide-react";
import { getAvailableVerticalSpace } from '@/lib/utils';
import { CompanyFilterState } from "../types/company.types";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";

interface CompanyFilterBarProps {
  filters: CompanyFilterState;
  onFilterChange: (key: keyof CompanyFilterState, value: any) => void;
  onSortToggle: (field: string) => void;
  totalCount: number;
  layoutMode: "grid" | "table";
  onLayoutModeChange: (mode: "grid" | "table") => void;
  onResetFilters?: () => void;
}

const statusFilterOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
];

/** Reusable hook: close dropdown when clicking outside or pressing Escape */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && ref.current) {
      const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(ref.current);
      setOpenUpward(spaceBelow < 250 && spaceAbove > spaceBelow);
    }
    setOpen((p) => !p);
  };

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen, ref, openUpward, toggle };
}

/** Dropdown panel shared style */
const getPanelClass = (openUpward?: boolean) =>
  `absolute right-0 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#1C2333] ${
    openUpward ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
  }`;
const ITEM  = "w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer";
const HDR   = "px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider";

/** Sort dropdown — "Sort By / Name (A-Z) / Name (Z-A) / Clear All Sorting" */
function SortDropdown({
  sortBy,
  sortOrder,
  onSort,
  onClear,
}: {
  sortBy: string;
  sortOrder: string;
  onSort: (field: string, order: "asc" | "desc") => void;
  onClear: () => void;
}) {
  const { open, setOpen, ref, openUpward, toggle } = useDropdown();

  const isActive = sortBy === "companyName";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer
          ${isActive
            ? "border-slate-500 bg-slate-800 text-white dark:border-white/30 dark:bg-[#1E293B] dark:text-white"
            : "border-slate-200 bg-white text-slate-700 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-200"
          }
          hover:border-slate-400 dark:hover:border-white/20`}
      >
        Sort
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={getPanelClass(openUpward)}>
          <div className={HDR}>Sort By</div>
          <div className="py-1">
            <button
              type="button"
              className={ITEM}
              onClick={() => { onSort("companyName", "asc"); setOpen(false); }}
            >
              Name (A-Z)
            </button>
            <button
              type="button"
              className={ITEM}
              onClick={() => { onSort("companyName", "desc"); setOpen(false); }}
            >
              Name (Z-A)
            </button>
          </div>
          <div className="border-t border-slate-100 dark:border-white/[0.06]" />
          <div className="py-1">
            <button
              type="button"
              className={ITEM}
              onClick={() => { onClear(); setOpen(false); }}
            >
              Clear All Sorting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Settings/filter icon dropdown — "Table Settings / Clear All Sorting / Clear All Filters" */
function SettingsDropdown({
  onClearSorting,
  onClearFilters,
}: {
  onClearSorting: () => void;
  onClearFilters: () => void;
}) {
  const { open, setOpen, ref, openUpward, toggle } = useDropdown();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        title="Table Settings"
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/20 transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className={getPanelClass(openUpward)}>
          <div className={HDR}>Table Settings</div>
          <div className="py-1">
            <button
              type="button"
              className={ITEM}
              onClick={() => { onClearSorting(); setOpen(false); }}
            >
              Clear All Sorting
            </button>
            <button
              type="button"
              className={ITEM}
              onClick={() => { onClearFilters(); setOpen(false); }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyFilterBar({
  filters,
  onFilterChange,
  onSortToggle,
  totalCount,
  layoutMode,
  onLayoutModeChange,
  onResetFilters,
}: CompanyFilterBarProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== "All";

  const handleSort = (field: string, order: "asc" | "desc") => {
    onFilterChange("sortBy", field);
    onFilterChange("sortOrder", order);
  };

  const handleClearSorting = () => {
    onFilterChange("sortBy", "createdAt");
    onFilterChange("sortOrder", "desc");
  };

  const handleClearFilters = () => {
    onResetFilters?.();
  };

  return (
    <div className="space-y-3">
      {/* Search + Sort + Settings + Status + Layout bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] p-3 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by store name, company or marketplace..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#E7E0D2] bg-slate-50 dark:border-white/[0.1] dark:bg-[#080B11] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F5C451] focus:border-[#F5C451] dark:focus:ring-[#E8C16D]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange("search", "")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={filters.status}
            onChange={(val) => onFilterChange("status", val)}
            options={statusFilterOptions}
            buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl"
            menuClassName="w-40"
          />

          {/* Sort dropdown */}
          <SortDropdown
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
            onClear={handleClearSorting}
          />

          {/* Settings / filter icon */}
          <SettingsDropdown
            onClearSorting={handleClearSorting}
            onClearFilters={handleClearFilters}
          />

          {/* Reset Filters */}
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          {/* Layout Mode Toggle (Grid vs Table) */}
          <div className="flex items-center rounded-xl border border-[#E7E0D2] bg-slate-100/70 dark:border-white/[0.1] dark:bg-[#080B11] p-0.5 ml-1">
            <button
              type="button"
              onClick={() => onLayoutModeChange("grid")}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layoutMode === "grid"
                  ? "bg-[#F5C451] text-slate-900 shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange("table")}
              title="Table View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layoutMode === "table"
                  ? "bg-[#F5C451] text-slate-900 shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

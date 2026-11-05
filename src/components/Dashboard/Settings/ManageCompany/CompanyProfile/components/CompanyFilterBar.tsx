"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  Table,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { getAvailableVerticalSpace } from "@/lib/utils";
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen, ref, openUpward, toggle };
}

/** Dropdown panel shared style */
const getPanelClass = (openUpward?: boolean) =>
  `absolute right-0 z-50 min-w-[200px] rounded-2xl border border-[#E7E0D2] bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-100 ${
    openUpward ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
  }`;

/** Sort dropdown matching Theme UI for both light & dark mode */
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

  const isAsc = sortBy === "companyName" && sortOrder === "asc";
  const isDesc = sortBy === "companyName" && sortOrder === "desc";
  const isActive = isAsc || isDesc;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none
          ${
            isActive
              ? "border-[#E8C16D] bg-[#FFF9EC] text-[#B88728] dark:border-[#E8C16D] dark:bg-[#1A160E] dark:text-[#E8C16D]"
              : "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-white dark:hover:border-[#E8C16D]"
          }`}
      >
        <div className="grid h-4 w-4 place-items-center text-[#B88728] dark:text-[#E8C16D] shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
        </div>
        <span>Sort</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className={getPanelClass(openUpward)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sort By
          </div>
          <div className="flex flex-col gap-0.5 py-1">
            <button
              type="button"
              className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left ${
                isAsc
                  ? "bg-[#F5C451] text-slate-900 shadow-xs font-bold"
                  : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
              onClick={() => {
                onSort("companyName", "asc");
                setOpen(false);
              }}
            >
              <span>Name (A-Z)</span>
              {isAsc && <Check className="h-3.5 w-3.5 text-slate-900 shrink-0 stroke-[2.5]" />}
            </button>
            <button
              type="button"
              className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left ${
                isDesc
                  ? "bg-[#F5C451] text-slate-900 shadow-xs font-bold"
                  : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
              onClick={() => {
                onSort("companyName", "desc");
                setOpen(false);
              }}
            >
              <span>Name (Z-A)</span>
              {isDesc && <Check className="h-3.5 w-3.5 text-slate-900 shrink-0 stroke-[2.5]" />}
            </button>
          </div>
          <div className="border-t border-slate-100 dark:border-white/[0.06]" />
          <div className="pt-1">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-all cursor-pointer text-left"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              <span>Clear All Sorting</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Settings/filter icon dropdown matching Theme UI for both light & dark mode */
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
        className="inline-flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-white dark:hover:border-[#E8C16D]"
      >
        <div className="grid h-4 w-4 place-items-center text-[#B88728] dark:text-[#E8C16D] shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </div>
        <span>Settings</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className={getPanelClass(openUpward)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Table Settings
          </div>
          <div className="flex flex-col gap-0.5 py-1">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => {
                onClearSorting();
                setOpen(false);
              }}
            >
              <span>Clear All Sorting</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => {
                onClearFilters();
                setOpen(false);
              }}
            >
              <span>Clear All Filters</span>
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
    Boolean(filters.search) || filters.status !== "All";

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
      {/* Searchbar + Filter Pills matching media_1793780330613_48c59a6f.png */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm">
        {/* Search Input matching pill style */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            placeholder="Search by store name, company or marketplace..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full h-10 pl-10 pr-9 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Controls matching pill style in media_1793780330613_48c59a6f.png */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Pill with Golden Clock Icon */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={filters.status}
            onChange={(val) => onFilterChange("status", val)}
            options={statusFilterOptions}
            icon={<Clock className="h-3.5 w-3.5" />}
            buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
            menuClassName="w-44 rounded-2xl"
          />

          {/* Sort dropdown Pill */}
          <SortDropdown
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
            onClear={handleClearSorting}
          />

          {/* Table Settings dropdown Pill */}
          <SettingsDropdown
            onClearSorting={handleClearSorting}
            onClearFilters={handleClearFilters}
          />

          {/* Reset Filters Pill matching media_1793780330613_48c59a6f.png */}
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset Filters"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Layout Mode Toggle (Grid vs Table) */}
          <div className="flex items-center h-10 rounded-full border border-[#E7E0D2] bg-slate-100/70 dark:border-white/[0.1] dark:bg-[#080B11] p-1 ml-1">
            <button
              type="button"
              onClick={() => onLayoutModeChange("grid")}
              title="Card Grid View"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                layoutMode === "grid"
                  ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange("table")}
              title="Table View"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                layoutMode === "table"
                  ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs font-bold"
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

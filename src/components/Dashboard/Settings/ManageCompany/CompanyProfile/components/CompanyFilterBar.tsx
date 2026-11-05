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
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
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

const sortFilterOptions: ThemeSelectOption[] = [
  { value: "name_asc", label: "Name (A - Z)" },
  { value: "name_desc", label: "Name (Z - A)" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
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
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none",
          "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-white dark:hover:border-[#E8C16D]",
          open && "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
        )}
      >
        <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/15 dark:text-[#F5C451] shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </div>
        <span>Settings</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 w-52 rounded-2xl border border-[#E7E0D2] bg-white p-1.5 shadow-xl duration-100 dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50",
            openUpward
              ? "bottom-full mb-2 origin-bottom animate-in fade-in zoom-in-95"
              : "top-full mt-2 origin-top animate-in fade-in zoom-in-95"
          )}
        >
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => {
                onClearSorting();
                setOpen(false);
              }}
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/15 dark:text-[#F5C451] shrink-0">
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <span className="truncate flex-1">Reset Sorting</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => {
                onClearFilters();
                setOpen(false);
              }}
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 shrink-0">
                <X className="h-3.5 w-3.5" />
              </div>
              <span className="truncate flex-1">Reset All Filters</span>
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

  const currentSortValue = React.useMemo(() => {
    if (filters.sortBy === "companyName" && filters.sortOrder === "asc") return "name_asc";
    if (filters.sortBy === "companyName" && filters.sortOrder === "desc") return "name_desc";
    if (filters.sortBy === "createdAt" && filters.sortOrder === "asc") return "oldest";
    if (filters.sortBy === "createdAt" && filters.sortOrder === "desc") return "newest";
    return "";
  }, [filters.sortBy, filters.sortOrder]);

  const handleSortChange = (val: string) => {
    if (val === "name_asc") {
      onFilterChange("sortBy", "companyName");
      onFilterChange("sortOrder", "asc");
    } else if (val === "name_desc") {
      onFilterChange("sortBy", "companyName");
      onFilterChange("sortOrder", "desc");
    } else if (val === "newest") {
      onFilterChange("sortBy", "createdAt");
      onFilterChange("sortOrder", "desc");
    } else if (val === "oldest") {
      onFilterChange("sortBy", "createdAt");
      onFilterChange("sortOrder", "asc");
    }
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

          {/* Sort Filter Pill with Golden ArrowUpDown Icon */}
          <ThemeSelectDropdown
            ariaLabel="Sort Companies"
            value={currentSortValue}
            onChange={handleSortChange}
            options={sortFilterOptions}
            icon={<ArrowUpDown className="h-3.5 w-3.5" />}
            placeholder="Sort"
            buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
            menuClassName="w-44 rounded-2xl"
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

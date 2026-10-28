"use client";

import React from "react";
import { ArrowUpDown, Search, LayoutGrid, Table, X } from "lucide-react";
import { WebstoreFilterState, MARKETPLACE_CHANNELS } from "../types/webstore.types";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";

interface WebstoreFilterSortBarProps {
  filters: WebstoreFilterState;
  onFilterChange: (key: keyof WebstoreFilterState, value: any) => void;
  onSortToggle: (field: string) => void;
  totalCount: number;
  layoutMode: "grid" | "table";
  onLayoutModeChange: (mode: "grid" | "table") => void;
  onResetFilters?: () => void;
}

const channelFilterOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Channels" },
  ...MARKETPLACE_CHANNELS.map((ch) => ({ value: ch, label: ch })),
];

const statusFilterOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function WebstoreFilterSortBar({
  filters,
  onFilterChange,
  onSortToggle,
  totalCount,
  layoutMode,
  onLayoutModeChange,
  onResetFilters,
}: WebstoreFilterSortBarProps) {
  const sortColumns = [
    { key: "storeName", label: "Webstore Name" },
    { key: "marketplaceName", label: "Marketplace Name" },
    { key: "billTo", label: "Company Name" },
    { key: "skuCount", label: "No.of Sub-SKUs" },
    { key: "registrationDate", label: "Registration Date" },
    { key: "isActive", label: "Status" },
  ];

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.marketplaceName !== "All" ||
    filters.isActive !== "All";

  return (
    <div className="space-y-3">
      {/* Top Search, Channel Filter & View Toggle Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.08] p-3 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by store name, company or marketplace..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[0.1] dark:bg-[#080B11] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0284C7] dark:focus:ring-[#E8C16D]"
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

        {/* Channel Dropdown, Status Filter & Layout Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Marketplace Filter */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Channel"
            value={filters.marketplaceName}
            onChange={(val) => onFilterChange("marketplaceName", val)}
            options={channelFilterOptions}
            buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl"
            menuClassName="w-48"
          />

          {/* Status Filter */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={filters.isActive}
            onChange={(val) => onFilterChange("isActive", val)}
            options={statusFilterOptions}
            buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl"
            menuClassName="w-40"
          />

          {/* Reset Filters button */}
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
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[0.1] dark:bg-[#080B11] p-0.5 ml-1">
            <button
              type="button"
              onClick={() => onLayoutModeChange("grid")}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-[#0284C7] dark:text-[#38BDF8] shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange("table")}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === "table"
                  ? "bg-white dark:bg-slate-800 text-[#0284C7] dark:text-[#38BDF8] shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Styled Columns Bar matching Screenshot (Header bar with sort arrows) - Shown in Grid view */}
      {layoutMode === "grid" && (
        <div className="overflow-x-auto rounded-xl bg-[#4A5568] dark:bg-[#1E293B] border border-slate-300 dark:border-white/[0.08] shadow-sm">
          <div className="grid grid-cols-6 min-w-[700px] text-white text-xs font-bold py-2.5 px-4 select-none">
            {sortColumns.map((col) => {
              const isSorted = filters.sortBy === col.key;
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => onSortToggle(col.key)}
                  className={`flex items-center gap-1.5 text-left hover:text-[#E8C16D] transition-colors cursor-pointer ${
                    col.key === "isActive" ? "justify-center" : ""
                  }`}
                >
                  <span>{col.label}</span>
                  <ArrowUpDown
                    className={`h-3 w-3 transition-opacity ${
                      isSorted ? "opacity-100 text-[#E8C16D]" : "opacity-60"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Search, ArrowUpDown, RotateCcw, X } from "lucide-react";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";

interface Props {
  search: string;
  onSearchChange: (search: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onReset?: () => void;
}

const SORT_OPTIONS = [
  { label: "Name (A - Z)", value: "name_asc" },
  { label: "Name (Z - A)", value: "name_desc" },
];

export default function UserToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onReset,
}: Props) {
  const handleSortChange = (newSort: string) => {
    // If the active sort is clicked again, reset to default oldest first
    if (newSort === sort) {
      onSortChange("oldest");
    } else {
      onSortChange(newSort);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onSearchChange("");
      onSortChange("oldest");
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
      {/* Search Bar matching OrderOS pill theme */}
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Global search..."
          className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right Controls: Sort & Reset */}
      <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center">
        {/* Sort ThemeSelectDropdown Pill */}
        <ThemeSelectDropdown
          value={sort}
          onChange={handleSortChange}
          options={SORT_OPTIONS}
          icon={<ArrowUpDown className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />}
          placeholder="Sort"
          ariaLabel="Sort Users"
          buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
        />

        {/* Reset Trigger Button Pill */}
        <button
          type="button"
          onClick={handleReset}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors cursor-pointer shadow-xs active:scale-95"
          title="Reset Search and Sort"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

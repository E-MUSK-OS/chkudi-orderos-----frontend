"use client";

import React from "react";
import { Search, ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";

interface Props {
  search: string;
  onSearchChange: (search: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { label: "Name (A - Z)", value: "name_asc" },
  { label: "Name (Z - A)", value: "name_desc" },
];

export default function UserToolbar({ search, onSearchChange, sort, onSortChange }: Props) {
  const handleSortChange = (newSort: string) => {
    // If the active sort is clicked again, reset to default oldest first
    if (newSort === sort) {
      onSortChange("oldest");
    } else {
      onSortChange(newSort);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
      {/* Search Bar matching Amazon Analytics OrderOS theme */}
      <div className="w-full sm:max-w-md transition-all">
        <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:bg-white/[0.04] dark:hover:border-[#F5C451]/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#080B11]">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Global search..."
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Sort & Filter */}
      <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-center">
        {/* Sort ThemeSelectDropdown (Default: oldest first, options: Name A-Z, Name Z-A) */}
        <ThemeSelectDropdown
          value={sort}
          onChange={handleSortChange}
          options={SORT_OPTIONS}
          icon={<ArrowUpDown className="h-3.5 w-3.5" />}
          placeholder="Sort"
          ariaLabel="Sort Users"
        />

        {/* Filter Trigger Button */}
        <button
          type="button"
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all shadow-xs hover:border-[#E8C16D]"
          title="Filter Settings"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>
    </div>
  );
}

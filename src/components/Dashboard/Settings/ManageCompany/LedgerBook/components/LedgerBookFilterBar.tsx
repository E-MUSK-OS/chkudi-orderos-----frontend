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
import { LedgerFilterState } from "../types/ledger.types";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import { cn } from "@/lib/utils";

interface LedgerBookFilterBarProps {
  filters: LedgerFilterState;
  onFilterChange: (key: keyof LedgerFilterState, value: any) => void;
  onResetFilters: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: string) => void;
  totalCount: number;
}

const ACCOUNT_HEAD_OPTIONS = [
  "All",
  "Employee",
  "Sundry Creditors",
  "Sundry Debtors",
  "Bank Accounts",
  "Direct Expenses",
  "Indirect Expenses",
  "Direct Incomes",
  "Indirect Incomes",
  "Capital Account",
  "Duties & Taxes",
  "Purchase Accounts",
  "Sales Accounts",
  "Loans & Advances",
];

const accountHeadOptions: ThemeSelectOption[] = ACCOUNT_HEAD_OPTIONS.map((head) => ({
  value: head,
  label: head === "All" ? "Account Head (All)" : head,
}));

const COLUMN_DEFINITIONS = [
  { key: "no", label: "No." },
  { key: "logo", label: "Logo" },
  { key: "partyName", label: "Ledger Name." },
  { key: "accountCode", label: "Code." },
  { key: "accountHead", label: "Account Head." },
  { key: "contactPerson", label: "Contact Name." },
  { key: "gstin", label: "GSTN." },
  { key: "email", label: "EMail Id." },
  { key: "addedBy", label: "Added / Edited By" },
  { key: "actions", label: "Actions" },
];

export default function LedgerBookFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  visibleColumns,
  onToggleColumn,
  totalCount,
}: LedgerBookFilterBarProps) {
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
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
    Boolean(filters.ledgerName) ||
    (Boolean(filters.accountHead) && filters.accountHead !== "All");

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm">
      {/* Left side filters matching Company Profile & media_1793780330613_48c59a6f.png pill style */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Ledger Name Pill Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={filters.ledgerName}
            onChange={(e) => onFilterChange("ledgerName", e.target.value)}
            placeholder="Ledger Name"
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {filters.ledgerName && (
            <button
              type="button"
              onClick={() => onFilterChange("ledgerName", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Account Head Dropdown Pill */}
        <ThemeSelectDropdown
          ariaLabel="Filter by Account Head"
          value={filters.accountHead && filters.accountHead !== "" ? filters.accountHead : "All"}
          onChange={(val) => onFilterChange("accountHead", val)}
          options={accountHeadOptions}
          buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
          menuClassName="w-56 rounded-2xl"
        />

        {/* Reset Filters Pill matching media_1793780330613_48c59a6f.png */}
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

      {/* Right side search & column controls matching pill style */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Global Search Pill Input */}
        <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Global search..."
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
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

        {/* Columns Dropdown Pill Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Toggle Columns"
            onClick={() => setColumnsDropdownOpen((prev) => !prev)}
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

          {/* Columns Dropdown Menu - Theme UI style */}
          {columnsDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-[#E7E0D2] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] mb-1">
                Toggle Columns
              </div>
              <div
                className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {COLUMN_DEFINITIONS.map((col) => {
                  const isVisible = visibleColumns[col.key] !== false;
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
                        font-bold
                        transition-all
                        cursor-pointer
                        text-left
                        ${
                          isVisible
                            ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                            : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      <span className="truncate">{col.label}</span>
                      {isVisible && (
                        <Check className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D] shrink-0 stroke-[2.5]" />
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

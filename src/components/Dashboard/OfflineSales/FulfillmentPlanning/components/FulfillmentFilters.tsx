"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  RotateCw,
  Columns3,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Calculator,
  PinOff,
  X,
  Building2,
} from "lucide-react";
import { SalesOrderFilterState } from "../../SalesOrder/types/salesOrder.types";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";

interface FulfillmentFiltersProps {
  filters: SalesOrderFilterState;
  onChange: (key: keyof SalesOrderFilterState, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  visibleColumns?: Record<string, boolean>;
  onToggleColumn?: (columnKey: string) => void;
  onClearSorting?: () => void;
  onClearAggregations?: () => void;
  onResetPinning?: () => void;
}

const statusOptions: ThemeSelectOption[] = [
  { value: "Pending", label: "Pending" },
  { value: "Partial", label: "Partial" },
  { value: "Completed", label: "Completed" },
];

const columnDefinitions = [
  { key: "date", label: "Date." },
  { key: "orderNo", label: "Order No." },
  { key: "party", label: "Party." },
  { key: "contactNo", label: "Contact No." },
  { key: "orderQty", label: "Order Qty." },
  { key: "deliveredQty", label: "Delivered Qty." },
  { key: "pendingQty", label: "Pending Qty." },
  { key: "totalAmount", label: "Total Amount." },
  { key: "expDeliveryDate", label: "Exp. Delivery Date." },
  { key: "status", label: "Status." },
];

export default function FulfillmentFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  visibleColumns,
  onToggleColumn,
  onClearSorting,
  onClearAggregations,
  onResetPinning,
}: FulfillmentFiltersProps) {
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const tableSettingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnsDropdownRef.current &&
        !columnsDropdownRef.current.contains(event.target as Node)
      ) {
        setColumnsMenuOpen(false);
      }
      if (
        tableSettingsRef.current &&
        !tableSettingsRef.current.contains(event.target as Node)
      ) {
        setTableSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = Boolean(
    filters.party || filters.fulfillmentPlan || filters.search
  );

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
        {/* Row 1: Filter Inputs & Dropdowns */}
        <div className="grid grid-cols-2 gap-2 lg:flex-1 min-w-0">
          {/* 1. Funnel Icon + Party */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <Filter className="w-4 h-4" />
            </div>

            <div className="relative flex-1 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={filters.party}
                onChange={(e) => onChange("party", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Party"
                className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          {/* 2. Status */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              value={filters.fulfillmentPlan || ""}
              onChange={(val) => onChange("fulfillmentPlan", val)}
              options={statusOptions}
              placeholder="Status"
              icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              className="w-full"
              buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                filters.fulfillmentPlan
                  ? "font-semibold text-[#0A0E1A] dark:text-white"
                  : "font-normal text-slate-400 dark:text-slate-500"
              }`}
            />
          </div>
        </div>

        {/* Row 2: Right Controls */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full lg:w-auto lg:shrink-0 lg:flex-nowrap">
          <div className="relative w-full sm:flex-1 lg:flex-none lg:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Global search.."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">

          {/* Columns */}
          <div className="relative" ref={columnsDropdownRef}>
            <button
              type="button"
              onClick={() => setColumnsMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] cursor-pointer"
            >
              <Columns3 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Columns</span>
            </button>

            {columnsMenuOpen && visibleColumns && onToggleColumn && (
              <div className="absolute right-0 top-full mt-1.5 w-52 p-2 rounded-2xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Toggle Columns
                </div>
                <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {columnDefinitions.map((col) => {
                    const isVisible = visibleColumns[col.key] !== false;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => onToggleColumn(col.key)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer text-left"
                      >
                        <span>{col.label}</span>
                        <div
                          className={`grid h-4 w-4 place-items-center rounded border ${
                            isVisible
                              ? "bg-[#E8C16D] border-[#E8C16D] text-black"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {isVisible && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Table Settings */}
          <div className="relative" ref={tableSettingsRef}>
            <button
              type="button"
              onClick={() => setTableSettingsOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] cursor-pointer"
              title="Table Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            {tableSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-1.5 shadow-xl z-40">
                {onClearSorting && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearSorting();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Clear Sorting</span>
                  </button>
                )}
                {onClearAggregations && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearAggregations();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Toggle Sum Row</span>
                  </button>
                )}
                {onResetPinning && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetPinning();
                      setTableSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                    <span>Reset Pinning</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="grid h-9 w-9 place-items-center rounded-full border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#080B11] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
            title="Reset Filters"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

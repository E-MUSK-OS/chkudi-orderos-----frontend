"use client";

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Columns3,
  FileText,
  Filter,
  ReceiptText,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";

export interface MaterialInvoiceColumnOption {
  id: string;
  label: string;
  visible: boolean;
}

interface MaterialInvoiceFiltersProps {
  party: string;
  onPartyChange: (v: string) => void;
  partyChallanNo: string;
  onPartyChallanNoChange: (v: string) => void;
  partyBillNo: string;
  onPartyBillNoChange: (v: string) => void;
  invoiceType: string;
  onInvoiceTypeChange: (v: string) => void;
  material: string;
  onMaterialChange: (v: string) => void;
  materialOptions: ThemeSelectOption[];
  startDate: string;
  endDate: string;
  onDateRangeChange: (s: string, e: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  columns: MaterialInvoiceColumnOption[];
  onToggleColumn: (colId: string) => void;
  onClearFilters: () => void;
  onToggleAggregations?: () => void;
}

function parseFilterDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "All", label: "All" },
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Bill of Supply", label: "Bill of Supply" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "Proforma Invoice", label: "Proforma Invoice" },
];

export default function MaterialInvoiceFilters({
  party,
  onPartyChange,
  partyChallanNo,
  onPartyChallanNoChange,
  partyBillNo,
  onPartyBillNoChange,
  invoiceType,
  onInvoiceTypeChange,
  material,
  onMaterialChange,
  materialOptions,
  startDate,
  endDate,
  onDateRangeChange,
  search,
  onSearchChange,
  columns,
  onToggleColumn,
  onClearFilters,
  onToggleAggregations,
}: MaterialInvoiceFiltersProps) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleDateRange = (range: { from?: Date; to?: Date }) => {
    const s = range.from ? format(range.from, "yyyy-MM-dd") : "";
    const e = range.to ? format(range.to, "yyyy-MM-dd") : "";
    onDateRangeChange(s, e);
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-2.5">
        {/* Row 1: 6 Filters matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 2xl:flex-1 min-w-0">
          {/* 1. Funnel Icon + Party */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <Filter className="w-4 h-4" />
            </div>
            <div className="relative flex-1 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={party}
                onChange={(e) => onPartyChange(e.target.value)}
                placeholder="Party"
                className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          {/* 2. Party Challan No */}
          <div className="relative min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={partyChallanNo}
              onChange={(e) => onPartyChallanNoChange(e.target.value)}
              placeholder="Party Challan No"
              className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          {/* 3. Party Bill No */}
          <div className="relative min-w-0">
            <ReceiptText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={partyBillNo}
              onChange={(e) => onPartyBillNoChange(e.target.value)}
              placeholder="Party Bill No"
              className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          {/* 4. Invoice Type */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              value={invoiceType}
              onChange={onInvoiceTypeChange}
              options={invoiceTypeOptions}
              placeholder="Invoice Type"
              showAllLabel
              icon={<ReceiptText className="w-3.5 h-3.5 text-slate-400" />}
              className="w-full"
              buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                !invoiceType
                  ? "font-normal text-slate-400 dark:text-slate-400"
                  : "font-semibold text-[#0A0E1A] dark:text-white"
              }`}
            />
          </div>

          {/* 5. Select Date */}
          <div className="min-w-0">
            <DateRangePicker
              from={parseFilterDate(startDate)}
              to={parseFilterDate(endDate)}
              onChange={handleDateRange}
              onClear={() => handleDateRange({ from: undefined, to: undefined })}
              placeholder="Select Date"
              className="w-full"
              triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs sm:text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
            />
          </div>

          {/* 6. Material */}
          <div className="min-w-0">
            <ThemeSelectDropdown
              value={material}
              onChange={onMaterialChange}
              options={[{ value: "All", label: "All" }, ...materialOptions]}
              placeholder="Material"
              showAllLabel
              icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
              className="w-full"
              buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                !material
                  ? "font-normal text-slate-400 dark:text-slate-400"
                  : "font-semibold text-[#0A0E1A] dark:text-white"
              }`}
            />
          </div>
        </div>

        {/* Row 2: Global Search, Columns, Settings, Reset */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full 2xl:w-auto 2xl:shrink-0 2xl:flex-nowrap">
          <div className="relative flex-1 sm:w-44 lg:w-52 2xl:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Global search..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Columns Dropdown */}
            <div className="relative" ref={columnsRef}>
              <button
                type="button"
                onClick={() => setColumnsOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer"
              >
                <Columns3 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Columns</span>
              </button>
              {columnsOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-xl p-2 z-50 space-y-1">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => onToggleColumn(col.id)}
                        className="rounded accent-[#B88728]"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] cursor-pointer"
                title="Table Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-xl p-1.5 z-50">
                  {onToggleAggregations && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleAggregations();
                        setSettingsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      Toggle Summary Row
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilters();
                      setSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Reset Icon */}
            <button
              type="button"
              onClick={onClearFilters}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

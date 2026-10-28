"use client";

import React from "react";
import { Search, RotateCw, FileText, User, Tag, Calendar, Layers } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { SalesInvoiceFilterState } from "../types/salesInvoice.types";

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "All", label: "Select Invoice Type" },
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "URD Tax Invoice", label: "URD Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
];

const statusOptions: ThemeSelectOption[] = [
  { value: "All", label: "Select Payment Status" },
  { value: "Pending", label: "Pending" },
  { value: "Close", label: "Close" },
];

interface InvoiceFiltersProps {
  filters: SalesInvoiceFilterState;
  onChange: (field: keyof SalesInvoiceFilterState, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function InvoiceFilters({
  filters,
  onChange,
  onSearch,
  onReset,
}: InvoiceFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* Invoice No */}
        <div className="relative flex items-center">
          <FileText className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.invoiceNo || ""}
            onChange={(e) => onChange("invoiceNo", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Invoice No..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Challan No / Ref No */}
        <div className="relative flex items-center">
          <FileText className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.challanNo || ""}
            onChange={(e) => onChange("challanNo", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Challan No..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Party Name */}
        <div className="relative flex items-center">
          <User className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.partyName || ""}
            onChange={(e) => onChange("partyName", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Party Name..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Product SKU */}
        <div className="relative flex items-center">
          <Tag className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.productSku || ""}
            onChange={(e) => onChange("productSku", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Product SKU..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Start Date */}
        <div className="relative flex items-center">
          <DatePicker
            value={filters.startDate}
            onChange={(_, dateStr) => onChange("startDate", dateStr || "")}
            placeholder="Start Date"
            buttonClassName="h-10 sm:h-11 text-xs sm:text-sm"
          />
        </div>

        {/* End Date */}
        <div className="relative flex items-center">
          <DatePicker
            value={filters.endDate}
            onChange={(_, dateStr) => onChange("endDate", dateStr || "")}
            placeholder="End Date"
            buttonClassName="h-10 sm:h-11 text-xs sm:text-sm"
          />
        </div>

        {/* Invoice Type Dropdown */}
        <div className="relative flex items-center">
          <ThemeSelectDropdown
            options={invoiceTypeOptions}
            value={filters.invoiceType || "All"}
            onChange={(val) => onChange("invoiceType", val)}
            placeholder="Select Invoice Type"
            className="w-full h-10 sm:h-11 text-xs sm:text-sm"
            buttonClassName="w-full h-full justify-between"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative flex items-center">
          <ThemeSelectDropdown
            options={statusOptions}
            value={filters.status || "All"}
            onChange={(val) => onChange("status", val)}
            placeholder="Select Payment Status"
            className="w-full h-10 sm:h-11 text-xs sm:text-sm"
            buttonClassName="w-full h-full justify-between"
          />
        </div>
      </div>

      {/* Filter and Reset Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <Button
          variant="outline"
          fullWidth={false}
          className="h-9 px-4 rounded-xl text-xs font-semibold"
          leftIcon={<RotateCw size={14} />}
          onClick={onReset}
        >
          Reset
        </Button>

        <Button
          variant="primary"
          fullWidth={false}
          className="h-9 px-5 rounded-xl text-xs font-bold shrink-0 bg-[#F5C451] text-[#0A0E1A] hover:bg-[#E8C16D] border-none"
          leftIcon={<Search size={14} />}
          onClick={onSearch}
        >
          Filter
        </Button>
      </div>
    </div>
  );
}

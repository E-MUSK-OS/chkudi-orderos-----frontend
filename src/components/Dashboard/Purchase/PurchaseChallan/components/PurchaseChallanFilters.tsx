"use client";

import React from "react";
import { Search, RotateCw, FileText, User, Tag } from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { PurchaseChallanFiltersState } from "../types/purchaseChallan.types";

const invoiceStatusOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Invoice Status" },
  { value: "Pending", label: "Pending" },
  { value: "Complete", label: "Complete" },
];

const challanForOptions: ThemeSelectOption[] = [
  { value: "All", label: "All Categories" },
  { value: "Purchase", label: "Purchase" },
  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
  { value: "Other", label: "Other" },
];

const stockInFilterOptions: ThemeSelectOption[] = [
  { value: "All", label: "All" },
  { value: "General", label: "General" },
  { value: "COCOBLU", label: "COCOBLU" },
  { value: "MYNTRA", label: "MYNTRA" },
];

interface PurchaseChallanFiltersProps {
  filters: PurchaseChallanFiltersState;
  onChange: (field: keyof PurchaseChallanFiltersState, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function PurchaseChallanFilters({
  filters,
  onChange,
  onSearch,
  onReset,
}: PurchaseChallanFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Challan No */}
        <div className="relative flex items-center">
          <FileText className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.challanNo}
            onChange={(e) => onChange("challanNo", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Challan No..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Party Challan No */}
        <div className="relative flex items-center">
          <FileText className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.partyChallanNo}
            onChange={(e) => onChange("partyChallanNo", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Party Challan No..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Supplier Name */}
        <div className="relative flex items-center">
          <User className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.supplierName}
            onChange={(e) => onChange("supplierName", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Supplier Name..."
            className="h-10 sm:h-11 w-full pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all outline-none dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Product SKU */}
        <div className="relative flex items-center">
          <Tag className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.productSku}
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
            buttonClassName="h-10 sm:h-11 w-full justify-between rounded-2xl text-xs sm:text-sm"
          />
        </div>

        {/* End Date */}
        <div className="relative flex items-center">
          <DatePicker
            value={filters.endDate}
            onChange={(_, dateStr) => onChange("endDate", dateStr || "")}
            placeholder="End Date"
            buttonClassName="h-10 sm:h-11 w-full justify-between rounded-2xl text-xs sm:text-sm"
          />
        </div>

        {/* Invoice Status Custom Dropdown */}
        <div className="relative flex items-center">
          <ThemeSelectDropdown
            ariaLabel="Filter by Invoice Status"
            value={filters.invoiceStatus}
            onChange={(val) => onChange("invoiceStatus", val)}
            options={invoiceStatusOptions}
            className="w-full"
            buttonClassName="w-full h-10 sm:h-11 justify-between font-normal text-xs sm:text-sm rounded-2xl"
            menuClassName="w-full min-w-[190px]"
          />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Challan For:
            </span>
            <ThemeSelectDropdown
              ariaLabel="Filter by Challan For"
              value={filters.challanFor}
              onChange={(val) => onChange("challanFor", val)}
              options={challanForOptions}
              buttonClassName="h-9 px-3 font-normal text-xs rounded-xl"
              menuClassName="min-w-[180px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Stock In:
            </span>
            <ThemeSelectDropdown
              ariaLabel="Filter by Stock In"
              value={filters.stockIn}
              onChange={(val) => onChange("stockIn", val)}
              options={stockInFilterOptions}
              buttonClassName="h-9 px-3 font-normal text-xs rounded-xl"
              menuClassName="min-w-[130px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="h-9 px-5 rounded-xl text-xs font-bold"
            leftIcon={<Search size={14} />}
            onClick={onSearch}
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

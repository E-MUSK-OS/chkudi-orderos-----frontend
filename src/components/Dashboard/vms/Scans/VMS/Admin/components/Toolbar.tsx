"use client";

import { Search, RotateCw, Download } from "lucide-react";

import ReactSelect from "@/components/ui/ReactSelect";
import DateRangePicker from "@/components/ui/DateRangePicker";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  operator: string;
  onOperatorChange: (value: string) => void;

  operatorOptions: {
    label: string;
    value: string;
  }[];

  account: string;
  onAccountChange: (value: string) => void;

  accountOptions: {
    label: string;
    value: string;
  }[];

  fromDate?: Date;
  toDate?: Date;

  onFromDateChange: (date?: Date) => void;
  onToDateChange: (date?: Date) => void;
  onDownload: () => void;

  onRefresh: () => void;
}

const statusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Failed",
    value: "FAILED",
  },
];

export default function Toolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  operator,
  onOperatorChange,
  operatorOptions,
  account,
  onAccountChange,
  accountOptions,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onDownload,
  onRefresh,
}: Props) {
  return (
    <div className="mb-6 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left Filters */}
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:flex-wrap xl:flex-nowrap lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:w-72 xl:w-80">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
          />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Tracking ID..."
            className="
              h-11 sm:h-12
              w-full
              rounded-2xl
              border
              border-slate-200
              dark:border-white/[0.08]
              bg-white
              dark:bg-[#080B11]
              pl-11
              pr-4
              text-xs sm:text-sm
              font-semibold
              text-[#0A0E1A]
              dark:text-white
              placeholder:text-slate-400
              dark:placeholder:text-slate-500
              placeholder:font-normal
              outline-none
              transition
              focus:border-[#E8C16D]
              focus:ring-2
              focus:ring-[#E8C16D]/30
              shadow-2xs
            "
          />
        </div>

        {/* Status */}
        <div className="w-full lg:w-44">
          <ReactSelect
            options={statusOptions}
            value={
              statusOptions.find((option) => option.value === status) ??
              statusOptions[0]
            }
            onChange={(option) => onStatusChange(option?.value ?? "")}
            placeholder="Status"
            height={46}
            borderRadius={16}
          />
        </div>

        {/* Operator */}
        <div className="w-full lg:w-48">
          <ReactSelect
            options={operatorOptions}
            value={
              operatorOptions.find((option) => option.value === operator) ??
              operatorOptions[0]
            }
            onChange={(option) => onOperatorChange(option?.value ?? "")}
            placeholder="Operator"
            height={46}
            borderRadius={16}
          />
        </div>

        {/* Account */}
        <div className="w-full lg:w-48">
          <ReactSelect
            options={accountOptions}
            value={
              accountOptions.find((option) => option.value === account) ??
              accountOptions[0]
            }
            onChange={(option) => onAccountChange(option?.value ?? "")}
            placeholder="Account"
            height={46}
            borderRadius={16}
          />
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-col gap-3 md:flex-row">
          <DateRangePicker
            from={fromDate}
            to={toDate}
            onChange={(range) => {
              onFromDateChange(range.from);
              onToDateChange(range.to);
            }}
          />
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] dark:bg-[#F5C451] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#080B11] transition-all shadow-xs hover:bg-[#d4af5a] dark:hover:bg-[#e0b040] cursor-pointer active:scale-[0.98]"
        >
          <RotateCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

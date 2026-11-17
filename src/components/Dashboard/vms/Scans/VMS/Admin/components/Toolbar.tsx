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
  const renderSearch = (className = "relative flex-1 min-w-[160px]") => (
    <div className={className}>
      <Search
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
      />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search Tracking ID..."
        className="
          h-11
          w-full
          rounded-2xl
          border
          border-slate-200
          dark:border-white/[0.08]
          bg-white
          dark:bg-[#080B11]
          pl-10
          pr-3
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
  );

  const renderStatus = (
    className = "w-full sm:w-36 md:w-40 shrink-0",
    fontSize = 14,
    paddingHorizontal = 14
  ) => (
    <div className={className}>
      <ReactSelect
        options={statusOptions}
        value={
          statusOptions.find((option) => option.value === status) ??
          statusOptions[0]
        }
        onChange={(option) => onStatusChange(option?.value ?? "")}
        placeholder="Status"
        height={44}
        fontSize={fontSize}
        paddingHorizontal={paddingHorizontal}
        borderRadius={16}
      />
    </div>
  );

  const renderOperator = (
    className = "w-full sm:w-40 md:w-44 shrink-0",
    fontSize = 14,
    paddingHorizontal = 14
  ) => (
    <div className={className}>
      <ReactSelect
        options={operatorOptions}
        value={
          operatorOptions.find((option) => option.value === operator) ??
          operatorOptions[0]
        }
        onChange={(option) => onOperatorChange(option?.value ?? "")}
        placeholder="Operator"
        height={44}
        fontSize={fontSize}
        paddingHorizontal={paddingHorizontal}
        borderRadius={16}
      />
    </div>
  );

  const renderAccount = (
    className = "w-full sm:w-36 md:w-40 shrink-0",
    fontSize = 14,
    paddingHorizontal = 14
  ) => (
    <div className={className}>
      <ReactSelect
        options={accountOptions}
        value={
          accountOptions.find((option) => option.value === account) ??
          accountOptions[0]
        }
        onChange={(option) => onAccountChange(option?.value ?? "")}
        placeholder="Account"
        height={44}
        fontSize={fontSize}
        paddingHorizontal={paddingHorizontal}
        borderRadius={16}
      />
    </div>
  );

  const renderDateRange = (
    className = "w-full sm:w-auto shrink-0",
    triggerClassName = "min-w-0 sm:min-w-[200px]"
  ) => (
    <div className={className}>
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onChange={(range) => {
          onFromDateChange(range.from);
          onToDateChange(range.to);
        }}
        triggerClassName={triggerClassName}
      />
    </div>
  );

  const renderButtons = (className = "flex items-center justify-start sm:justify-end gap-2 shrink-0") => (
    <div className={className}>
      <button
        type="button"
        onClick={onDownload}
        className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer shrink-0"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#B88728] dark:text-[#E8C16D]" />
        <span>Download</span>
      </button>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-transparent bg-[#E8C16D] dark:bg-[#F5C451] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#080B11] transition-all shadow-xs hover:bg-[#d4af5a] dark:hover:bg-[#e0b040] cursor-pointer active:scale-[0.98] shrink-0"
      >
        <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>Refresh</span>
      </button>
    </div>
  );

  return (
    <div className="shrink-0 mb-6 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
      {/* Desktop / Laptop L View (>= 1400px, e.g. 1440px): Single Balanced Row */}
      <div className="hidden min-[1400px]:flex min-[1400px]:items-center gap-2.5 w-full">
        {renderSearch("relative flex-1 min-w-[160px] max-w-[210px] 2xl:max-w-xs")}
        {renderStatus("w-[125px] 2xl:w-36 shrink-0", 13, 10)}
        {renderOperator("w-[150px] 2xl:w-44 shrink-0", 13, 10)}
        {renderAccount("w-[140px] 2xl:w-44 shrink-0", 13, 10)}
        {renderDateRange(
          "shrink-0",
          "min-w-0 sm:min-w-0 w-auto min-[1400px]:min-w-[190px] 2xl:min-w-[210px] px-3 h-11 text-xs sm:text-sm"
        )}
        {renderButtons("ml-auto flex items-center justify-end gap-2 shrink-0")}
      </div>

      {/* Laptop / Tablet / Mobile View (< 1400px, e.g. 1024px): 2 Balanced Rows */}
      <div className="min-[1400px]:hidden space-y-3.5">
        {/* Row 1: Search + Status + Operator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {renderSearch("relative flex-1 min-w-[200px]")}
          {renderStatus("w-full sm:w-36 md:w-40 shrink-0")}
          {renderOperator("w-full sm:w-40 md:w-44 shrink-0")}
        </div>

        {/* Row 2: Account + Date Range (left) + Action Buttons (right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {renderAccount("w-full sm:w-36 md:w-40 shrink-0")}
            {renderDateRange("w-full sm:w-auto shrink-0", "min-w-0 sm:min-w-[200px]")}
          </div>
          {renderButtons("flex items-center justify-start sm:justify-end gap-2.5 shrink-0 w-full sm:w-auto")}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Search, RefreshCw, Calendar, X } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: "ALL" | "PENDING" | "SCANNED";
  onStatusFilterChange: (status: "ALL" | "PENDING" | "SCANNED") => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  counts: {
    total: number;
    pending: number;
    scanned: number;
  };
}

export default function AwbToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedDate,
  onDateChange,
  onRefresh,
  isLoading,
  counts,
}: Props) {
  return (
    <div className="flex flex-col gap-4 border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm lg:flex-row lg:items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Tracking ID, Order ID, Invoice, Customer..."
          className="
            h-11 sm:h-12
            w-full
            border
            border-[#E7E0D2]
            bg-white
            pl-10
            pr-10
            text-xs sm:text-sm
            text-[#0A0E1A]
            placeholder:text-slate-400
            outline-none
            transition
            focus:border-[#E8C16D]
            focus:ring-1
            focus:ring-[#E8C16D]
          "
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0A0E1A] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Tabs matching Image 1 buttons */}
        <div className="flex items-center border border-[#0A0E1A] bg-[#0A0E1A] h-11 sm:h-12 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => onStatusFilterChange("ALL")}
            className={`h-full px-4 text-xs font-bold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#E8C16D] text-[#0A0E1A]"
                : "text-[#E8C16D] hover:bg-[#161D2E]"
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("PENDING")}
            className={`h-full px-4 text-xs font-bold transition cursor-pointer border-l border-slate-700 ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-[#0A0E1A]"
                : "text-[#E8C16D] hover:bg-[#161D2E]"
            }`}
          >
            Pending ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("SCANNED")}
            className={`h-full px-4 text-xs font-bold transition cursor-pointer border-l border-slate-700 ${
              statusFilter === "SCANNED"
                ? "bg-emerald-600 text-white"
                : "text-[#E8C16D] hover:bg-[#161D2E]"
            }`}
          >
            Scanned ({counts.scanned})
          </button>
        </div>

        {/* Date Selector */}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="
              h-11 sm:h-12
              border
              border-[#E7E0D2]
              bg-white
              pl-10
              pr-3
              text-xs sm:text-sm
              font-semibold
              text-[#0A0E1A]
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onDateChange("")}
              className="ml-2 p-1 text-slate-400 hover:text-[#0A0E1A] cursor-pointer"
              title="Clear date filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="
            flex
            h-11 sm:h-12
            items-center
            gap-2
            border
            border-[#0A0E1A]
            bg-[#0A0E1A]
            px-4 sm:px-5
            text-xs sm:text-sm
            font-semibold
            text-white
            transition
            hover:bg-[#161D2E]
            cursor-pointer
            shadow-sm
            disabled:opacity-50
          "
        >
          <RefreshCw className={`h-4 w-4 text-[#E8C16D] ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Tracking ID, Order ID, Invoice, Customer..."
          className="
            h-12
            w-full
            border
            border-slate-700
            bg-[#111827]
            pl-10
            pr-10
            text-sm
            text-white
            placeholder:text-slate-500
            outline-none
            transition
            focus:border-[#E8C16D]
          "
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Square Tabs */}
        <div className="flex items-center border border-slate-700 bg-[#111827] h-12">
          <button
            type="button"
            onClick={() => onStatusFilterChange("ALL")}
            className={`h-full px-4 text-xs font-bold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#E8C16D] text-[#0A0E1A]"
                : "text-slate-400 hover:text-white"
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
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("SCANNED")}
            className={`h-full px-4 text-xs font-bold transition cursor-pointer border-l border-slate-700 ${
              statusFilter === "SCANNED"
                ? "bg-emerald-500 text-[#0A0E1A]"
                : "text-slate-400 hover:text-white"
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
              h-12
              border
              border-slate-700
              bg-[#111827]
              pl-10
              pr-3
              text-sm
              font-semibold
              text-white
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => onDateChange("")}
              className="ml-2 p-1 text-slate-400 hover:text-white cursor-pointer"
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
            h-12
            items-center
            gap-2
            border
            border-slate-700
            bg-[#111827]
            px-4
            text-sm
            font-bold
            text-slate-300
            transition
            hover:border-[#E8C16D]
            hover:text-[#E8C16D]
            cursor-pointer
          "
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#E8C16D]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

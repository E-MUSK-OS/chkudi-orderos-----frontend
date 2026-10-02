"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw, Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

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
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "Select Date";
    try {
      return format(parseISO(selectedDate), "dd MMM yyyy");
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const parsedSelected = useMemo(() => {
    if (!selectedDate) return undefined;
    try {
      const d = parseISO(selectedDate);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [selectedDate]);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm lg:flex-row lg:items-center">
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
            rounded-xl
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
        <div className="flex items-center rounded-xl border border-[#0A0E1A] bg-[#0A0E1A] h-11 sm:h-12 shadow-sm overflow-hidden">
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

        {/* Date Filter matching Product Analytics UI */}
        <div className="relative flex items-center">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger className="inline-flex h-11 sm:h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0">
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-left font-bold whitespace-nowrap min-w-[85px] sm:min-w-[95px]">
                {formattedDate}
              </span>
              {selectedDate && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateChange("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      onDateChange("");
                    }
                  }}
                  className="ml-1 p-0.5 text-slate-400 hover:text-red-600 transition cursor-pointer rounded-full hover:bg-slate-100"
                  title="Clear date filter"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-3 rounded-2xl border border-[#E7E0D2] bg-white shadow-xl z-50">
              <Calendar
                mode="single"
                selected={parsedSelected}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(format(date, "yyyy-MM-dd"));
                    setIsDatePopoverOpen(false);
                  }
                }}
              />
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDateChange("");
                    setIsDatePopoverOpen(false);
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-red-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = format(new Date(), "yyyy-MM-dd");
                    onDateChange(today);
                    setIsDatePopoverOpen(false);
                  }}
                  className="text-[11px] font-bold text-[#B88728] hover:text-[#0A0E1A] transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#FFF9EC]"
                >
                  Today
                </button>
              </div>
            </PopoverContent>
          </Popover>
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
            rounded-xl
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

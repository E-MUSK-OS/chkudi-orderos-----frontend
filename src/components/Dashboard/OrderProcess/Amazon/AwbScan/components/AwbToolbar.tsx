"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw, Calendar as CalendarIcon, X, Download } from "lucide-react";
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
  onExport: () => void;
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
  onExport,
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
    <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
      {/* Search Input matching Product Analytics Amazon */}
      <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
        <div className="group flex h-10 sm:h-11 items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] px-3.5 sm:px-4 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:bg-white/[0.03] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#131926]">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#E8C16D]/10 text-[#B88728] dark:text-[#F5C451] shrink-0 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Tracking ID, Order ID, Invoice, Customer..."
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="grid h-5 w-5 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Status Tabs */}
        <div className="inline-flex h-10 sm:h-11 items-center rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.04] p-1 shadow-xs">
          <button
            type="button"
            onClick={() => onStatusFilterChange("ALL")}
            className={`h-full px-3 sm:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#0A0E1A] dark:bg-[#131926] text-[#E8C16D] dark:text-[#F5C451] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]"
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("PENDING")}
            className={`h-full px-3 sm:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === "PENDING"
                ? "bg-[#0A0E1A] dark:bg-[#131926] text-[#E8C16D] dark:text-[#F5C451] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]"
            }`}
          >
            Pending ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("SCANNED")}
            className={`h-full px-3 sm:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === "SCANNED"
                ? "bg-[#0A0E1A] dark:bg-[#131926] text-[#E8C16D] dark:text-[#F5C451] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]"
            }`}
          >
            Scanned ({counts.scanned})
          </button>
        </div>

        {/* Date Filter matching Product Analytics UI */}
        <div className="relative flex items-center">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 dark:hover:bg-white/[0.03] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#E8C16D]/10 text-[#B88728] dark:text-[#F5C451] shrink-0 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
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
                  className="ml-1 p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-600 transition cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  title="Clear date filter"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl z-50">
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
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDateChange("");
                    setIsDatePopoverOpen(false);
                  }}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
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
                  className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] hover:text-[#0A0E1A] dark:hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-[#E8C16D]/10"
                >
                  Today
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Export to Excel Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={isLoading}
          className="group inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-600 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-all duration-200 shadow-xs hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white dark:hover:text-white hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <Download className="h-4 w-4 transition-colors" />
          <span>Export</span>
        </button>

        {/* Refresh Button with black background, gold text, and gold hover effect */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="group inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#0A0E1A] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#131926] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#E8C16D] dark:text-[#F5C451] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-[#E8C16D] transition-colors group-hover:text-[#0A0E1A] ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from?: Date; to?: Date }) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export default function DateRangePicker({
  from,
  to,
  onChange,
  onClear,
  placeholder = "Select Date Range",
  className,
  triggerClassName,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({ from, to });
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync internal range whenever props change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRange({ from, to });
    setPendingStart(null);
  }, [from, to]);

  const label =
    from && to
      ? `${format(from, "dd MMM yyyy")} - ${format(to, "dd MMM yyyy")}`
      : from
        ? format(from, "dd MMM yyyy")
        : placeholder;

  const isSelected = Boolean(from || to);

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPendingStart(null);
    setRange({ from: undefined, to: undefined });
    onChange({ from: undefined, to: undefined });
    if (onClear) onClear();
  };

  const handleSelect = (
    _newRange: DateRange | undefined,
    triggerDate?: Date
  ) => {
    const clickedDate = triggerDate || _newRange?.from || _newRange?.to;
    if (!clickedDate) return;

    if (!pendingStart) {
      // 1. First click: Set Start Date only, keep picker OPEN
      setPendingStart(clickedDate);
      setRange({ from: clickedDate, to: undefined });
    } else {
      // 2. Second click: Set End Date, commit range, and close picker
      const fromDate = clickedDate < pendingStart ? clickedDate : pendingStart;
      const toDate = clickedDate < pendingStart ? pendingStart : clickedDate;
      const completedRange = { from: fromDate, to: toDate };

      setRange(completedRange);
      setPendingStart(null);
      onChange(completedRange);
      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // If closed without completing end date, revert internal state to committed props
      if (pendingStart) {
        setPendingStart(null);
        setRange({ from, to });
      }
    } else {
      setPendingStart(null);
      setRange({ from, to });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          "flex h-10 sm:h-11 w-full sm:w-auto min-w-0 sm:min-w-[240px] cursor-pointer items-center justify-between gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30",
          className,
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>
          <span
            className={cn(
              "truncate",
              isSelected
                ? "text-[#0A0E1A] dark:text-white font-semibold"
                : "text-slate-400 dark:text-slate-500 font-normal"
            )}
          >
            {label}
          </span>
        </div>

        {isSelected && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClear(e);
              }
            }}
            className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Clear date range"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={isMobile ? "center" : "start"}
        sideOffset={6}
        className="w-auto max-w-[calc(100vw-24px)] overflow-x-auto border border-[#E7E0D2] bg-white p-2 sm:p-3 shadow-2xl rounded-2xl sm:rounded-3xl dark:bg-[#0F1626] dark:border-white/[0.08] dark:shadow-black/50"
      >
        <Calendar
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={range}
          onSelect={handleSelect}
        />

        {/* Action bar with status and manual Apply / Reset options */}
        <div className="flex items-center justify-between border-t border-[#E7E0D2] dark:border-white/[0.08] pt-2 px-2 mt-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {pendingStart ? (
              <span className="text-[#B88728] dark:text-[#E8C16D] font-medium">
                Start: {format(pendingStart, "dd MMM")} &rarr; Select end date...
              </span>
            ) : range?.from && range?.to ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {format(range.from, "dd MMM")} - {format(range.to, "dd MMM yyyy")}
              </span>
            ) : (
              <span>Select date range</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPendingStart(null);
                setRange({ from: undefined, to: undefined });
                onChange({ from: undefined, to: undefined });
                if (onClear) onClear();
                setOpen(false);
              }}
              className="px-2.5 py-1 text-xs rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={!pendingStart && !range?.from}
              onClick={() => {
                const activeStart = pendingStart || range?.from;
                if (activeStart) {
                  const finalRange = {
                    from: activeStart,
                    to: pendingStart ? activeStart : (range?.to || activeStart),
                  };
                  setPendingStart(null);
                  setRange(finalRange);
                  onChange(finalRange);
                  setOpen(false);
                }
              }}
              className="px-3 py-1 text-xs font-semibold rounded-xl bg-[#0A0E1A] dark:bg-[#E8C16D] text-[#E8C16D] dark:text-[#0A0E1A] hover:bg-slate-800 dark:hover:bg-[#d9b25a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

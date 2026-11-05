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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const label =
    from && to
      ? `${format(from, "dd MMM yyyy")} - ${format(to, "dd MMM yyyy")}`
      : from
        ? format(from, "dd MMM yyyy")
        : placeholder;

  const isSelected = Boolean(from || to);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange({ from: undefined, to: undefined });
    if (onClear) onClear();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={className ? className : "w-full sm:w-auto"}>
        <div
          className={cn(
            "flex h-10 sm:h-11 w-full sm:w-auto min-w-0 sm:min-w-[240px] cursor-pointer items-center justify-between gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30",
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
            <button
              type="button"
              onClick={handleClear}
              className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
              title="Clear date range"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align={isMobile ? "center" : "start"}
        sideOffset={6}
        className="w-auto max-w-[calc(100vw-24px)] overflow-x-auto border border-[#E7E0D2] bg-white p-2 sm:p-3 shadow-2xl rounded-2xl sm:rounded-3xl dark:bg-[#0F1626] dark:border-white/[0.08] dark:shadow-black/50"
      >
        <Calendar
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={{
            from,
            to,
          }}
          onSelect={(range: DateRange | undefined) => {
            onChange({
              from: range?.from,
              to: range?.to,
            });

            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

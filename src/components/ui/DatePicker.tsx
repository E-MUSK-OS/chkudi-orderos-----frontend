"use client";

import React, { useState } from "react";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: Date | string;
  onChange?: (date?: Date, dateStr?: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  dateFormat?: string;
}

function parseDateValue(val?: Date | string): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      return isValid(parsed) ? parsed : undefined;
    }

    // Format DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      return isValid(parsed) ? parsed : undefined;
    }

    const parsed = new Date(trimmed);
    return isValid(parsed) ? parsed : undefined;
  }
  return undefined;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select Date",
  className,
  buttonClassName,
  popoverClassName,
  disabled = false,
  align = "start",
  dateFormat,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const dateObj = parseDateValue(value);
  const hasValue = Boolean(dateObj);
  const label = dateObj ? format(dateObj, dateFormat || "dd MMM yyyy") : placeholder;

  const handleSelect = (selectedDate?: Date) => {
    if (!selectedDate) {
      onChange?.(undefined, "");
      setOpen(false);
      return;
    }
    const dateStr = format(selectedDate, dateFormat || "yyyy-MM-dd");
    onChange?.(selectedDate, dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined, "");
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const dateStr = format(today, dateFormat || "yyyy-MM-dd");
    onChange?.(today, dateStr);
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border px-3.5 text-xs sm:text-sm transition-all outline-none select-none",
            "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
            "dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:hover:border-white/[0.15]",
            open && "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#E8C16D]",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            buttonClassName
          )}
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            <CalendarIcon
              size={15}
              className={cn(
                "shrink-0 transition-colors",
                hasValue
                  ? "text-[#B88728] dark:text-[#E8C16D]"
                  : "text-slate-400 dark:text-slate-500"
              )}
            />
            <span
              className={cn(
                "truncate",
                hasValue
                  ? "font-medium text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500 font-normal"
              )}
            >
              {label}
            </span>
          </div>

          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              title="Clear date"
              className="p-1 -mr-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={6}
          className={cn(
            "w-auto border border-[#E7E0D2] bg-white p-3 shadow-2xl rounded-2xl",
            "dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-slate-100 animate-in fade-in-0 zoom-in-95",
            popoverClassName
          )}
        >
          <Calendar
            mode="single"
            selected={dateObj}
            onSelect={handleSelect}
          />

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors px-2 py-1 rounded cursor-pointer font-medium"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[#B88728] hover:text-[#976a17] dark:text-[#E8C16D] dark:hover:text-[#F5C451] transition-colors px-2 py-1 rounded cursor-pointer font-bold"
            >
              Today
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

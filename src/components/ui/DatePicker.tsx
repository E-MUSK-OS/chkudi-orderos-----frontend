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
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  allowInput?: boolean;
  error?: boolean;
}

function parseDateValue(val?: Date | string): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) && !isNaN(val.getTime()) ? val : undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
      const parsed = new Date(y, m - 1, d);
      if (
        isValid(parsed) &&
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() === y &&
        parsed.getMonth() === m - 1 &&
        parsed.getDate() === d
      ) {
        return parsed;
      }
      return undefined;
    }

    // Format DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split("-").map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
      const parsed = new Date(y, m - 1, d);
      if (
        isValid(parsed) &&
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() === y &&
        parsed.getMonth() === m - 1 &&
        parsed.getDate() === d
      ) {
        return parsed;
      }
      return undefined;
    }

    // Format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split("/").map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
      const parsed = new Date(y, m - 1, d);
      if (
        isValid(parsed) &&
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() === y &&
        parsed.getMonth() === m - 1 &&
        parsed.getDate() === d
      ) {
        return parsed;
      }
      return undefined;
    }

    const parsed = new Date(trimmed);
    return isValid(parsed) && !isNaN(parsed.getTime()) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Formats user input as YYYY-MM-DD in real-time.
 * Automatically inserts '-' after 4 digits of year and after 2 digits of month.
 * Blocks any input exceeding 10 characters (8 digits).
 */
function formatDateInput(raw: string, isDeleting: boolean): string {
  if (isDeleting) {
    if (raw.endsWith("-")) {
      return raw.slice(0, -1);
    }
    return raw;
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY pasted input
  const dmyMatch = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Extract only digits, cap at 8 digits (YYYYMMDD)
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";

  if (digits.length < 4) {
    return digits;
  }
  if (digits.length === 4) {
    return `${digits}-`;
  }
  if (digits.length < 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-`;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "YYYY-MM-DD (e.g. 2004-07-01)",
  className,
  buttonClassName,
  popoverClassName,
  disabled = false,
  align = "start",
  dateFormat = "yyyy-MM-dd",
  captionLayout = "dropdown",
  allowInput = false,
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const dateObj = parseDateValue(value);
  const hasValue = Boolean(dateObj);
  const targetFormat = dateFormat || "yyyy-MM-dd";

  // Track external value prop during render without effect cascading
  const [prevValue, setPrevValue] = useState(value);
  const [userTyped, setUserTyped] = useState<string | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setUserTyped(null);
  }

  const inputValue =
    userTyped !== null
      ? userTyped
      : dateObj
      ? format(dateObj, targetFormat)
      : typeof value === "string"
      ? value
      : "";

  const handleSelect = (selectedDate?: Date) => {
    setUserTyped(null);
    if (!selectedDate) {
      onChange?.(undefined, "");
      setOpen(false);
      return;
    }
    const dateStr = format(selectedDate, targetFormat);
    onChange?.(selectedDate, dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserTyped(null);
    onChange?.(undefined, "");
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserTyped(null);
    const today = new Date();
    const dateStr = format(today, targetFormat);
    onChange?.(today, dateStr);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const isDeleting = raw.length < inputValue.length;
    const formatted = formatDateInput(raw, isDeleting);
    setUserTyped(formatted);

    if (formatted.length === 10) {
      const parsed = parseDateValue(formatted);
      if (parsed) {
        onChange?.(parsed, formatted);
      } else {
        onChange?.(undefined, formatted);
      }
    } else if (formatted.length === 0) {
      onChange?.(undefined, "");
    }
  };

  const handleInputBlur = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setUserTyped(null);
      onChange?.(undefined, "");
      return;
    }

    const parsed = parseDateValue(trimmed);
    if (parsed) {
      const formatted = format(parsed, targetFormat);
      setUserTyped(null);
      onChange?.(parsed, formatted);
    } else {
      onChange?.(undefined, trimmed);
    }
  };

  const label = dateObj ? format(dateObj, targetFormat) : placeholder;

  // --- ALLOW INPUT MODE: direct typing + auto hyphens + right-side calendar icon ---
  if (allowInput) {
    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          <input
            type="text"
            disabled={disabled}
            maxLength={10}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={cn(
              "w-full h-10 pl-3.5 pr-11 rounded-xl text-xs sm:text-sm bg-white border text-[#0A0E1A] placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs",
              "border-[#E7E0D2] dark:border-white/[0.08] dark:bg-[#161B26] dark:text-white dark:placeholder:text-slate-500",
              error && "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30",
              disabled && "opacity-50 cursor-not-allowed",
              buttonClassName
            )}
          />

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              type="button"
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Open calendar picker"
            >
              <CalendarIcon size={16} />
            </PopoverTrigger>

            <PopoverContent
              align={align || "end"}
              sideOffset={6}
              className={cn(
                "w-auto border border-[#E7E0D2] bg-white p-3 shadow-2xl rounded-2xl",
                "dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-slate-100 animate-in fade-in-0 zoom-in-95 z-50",
                popoverClassName
              )}
            >
              <Calendar
                mode="single"
                captionLayout={captionLayout}
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
      </div>
    );
  }

  // --- BUTTON MODE (Existing behaviour for filters & compact buttons) ---
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
            captionLayout={captionLayout}
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

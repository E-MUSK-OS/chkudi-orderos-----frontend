"use client";

import { useEffect, useState } from "react";

import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import Button from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;

  onChange: (range: { from?: Date; to?: Date }) => void;
}

export default function DateRangePicker({
  from,
  to,
  onChange,
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
        : "Select Date Range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div
          className="
            flex
            h-11 sm:h-12
            w-full sm:w-auto
            min-w-0 sm:min-w-[260px]
            cursor-pointer
            items-center
            justify-between sm:justify-start
            gap-2
            border
            border-[#E7E0D2]
            bg-white
            px-3.5 sm:px-4
            text-slate-800
            hover:bg-[#FDFBF7]
            transition
            font-medium
            text-xs sm:text-sm
            rounded-xl
            sm:rounded-2xl
            dark:bg-[#0B0F17]
            dark:border-white/[0.08]
            dark:text-white
            dark:hover:bg-white/[0.04]
          "
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align={isMobile ? "center" : "start"}
        sideOffset={6}
        className="
          w-auto
          max-w-[calc(100vw-24px)]
          overflow-x-auto
          border
          border-[#E7E0D2]
          bg-white
          p-2 sm:p-3
          shadow-2xl
          rounded-2xl sm:rounded-3xl
          dark:bg-[#0F1626]
          dark:border-white/[0.08]
          dark:shadow-black/50
        "
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

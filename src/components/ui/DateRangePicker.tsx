"use client";

import { useState } from "react";

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
      h-12
      min-w-[260px]
      cursor-pointer
      items-center
      gap-2
      border
      border-slate-700
      bg-[#111827]
      px-4
      text-white
      hover:bg-[#1E293B]
    "
        >
          <CalendarIcon size={18} />

          <span>{label}</span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="
          w-auto
          border
          border-slate-700
          bg-[#111827]
          p-3
        "
      >
        <Calendar
          mode="range"
          numberOfMonths={2}
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

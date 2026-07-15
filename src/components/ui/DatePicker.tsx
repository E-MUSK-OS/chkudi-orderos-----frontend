"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const label = value ? format(value, "dd MMM yyyy") : "Select Date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="
    flex
    h-12
    min-w-[220px]
    cursor-pointer
    items-center
    gap-2
    border
    border-slate-700
    bg-[#111827]
    px-4
    text-white
    transition
    hover:bg-[#1E293B]
  "
      >
        <CalendarIcon size={18} />
        <span>{label}</span>
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
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        //   initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

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
    rounded-xl
    sm:rounded-2xl
    border
    border-[#E7E0D2]
    bg-white
    text-[#0A0E1A]
    px-4
    transition
    hover:bg-[#FDFBF7]
    dark:border-white/[0.1]
    dark:bg-[#0F1626]
    dark:text-slate-100
    dark:hover:bg-[#131B2E]
  "
      >
        <CalendarIcon size={18} className="text-slate-400 dark:text-slate-400" />
        <span>{label}</span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="
          w-auto
          border
          border-[#E7E0D2]
          bg-white
          text-[#0A0E1A]
          p-3
          shadow-xl
          rounded-xl
          dark:border-white/[0.1]
          dark:bg-[#0F1626]
          dark:text-slate-100
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

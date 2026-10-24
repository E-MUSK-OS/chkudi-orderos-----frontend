"use client";

import { useState, useMemo } from "react";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ReactSelect from "@/components/ui/ReactSelect";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  operator: string;
  onOperatorChange: (value: string) => void;

  operatorOptions: {
    label: string;
    value: string;
  }[];

  account: string;
  onAccountChange: (value: string) => void;

  accountOptions: {
    label: string;
    value: string;
  }[];

  selectedDate: Date;

  onSelectedDateChange: (date: Date) => void;
}

export default function TrackingToolbar({
  search,
  onSearchChange,

  operator,
  onOperatorChange,
  operatorOptions,

  account,
  onAccountChange,
  accountOptions,

  selectedDate,
  onSelectedDateChange,
}: Props) {
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "Select Date";
    try {
      return format(selectedDate, "dd MMM yyyy");
    } catch {
      return "Select Date";
    }
  }, [selectedDate]);

  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 mb-6">
      {/* Search Input matching AwbToolbar */}
      <div className="flex-1 min-w-[240px] transition-all">
        <div className="group flex h-10 sm:h-11 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Tracking ID..."
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Operator Select */}
        <div className="w-full sm:w-52 md:w-56">
          <ReactSelect
            options={operatorOptions}
            value={
              operatorOptions.find((x) => x.value === operator) ??
              operatorOptions[0]
            }
            onChange={(option) => onOperatorChange(option?.value ?? "")}
            placeholder="Operator"
            height={44}
            borderRadius={16}
            borderColor="#E2E8F0"
            backgroundColor="#ffffff"
            textColor="#0A0E1A"
            placeholderColor="#64748B"
            menuBackgroundColor="#ffffff"
            optionHoverColor="#F8FAFC"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#0A0E1A"
          />
        </div>

        {/* Account Select */}
        <div className="w-full sm:w-52 md:w-56">
          <ReactSelect
            options={accountOptions}
            value={
              accountOptions.find((x) => x.value === account) ?? accountOptions[0]
            }
            onChange={(option) => onAccountChange(option?.value ?? "")}
            placeholder="Account"
            height={44}
            borderRadius={16}
            borderColor="#E2E8F0"
            backgroundColor="#ffffff"
            textColor="#0A0E1A"
            placeholderColor="#64748B"
            menuBackgroundColor="#ffffff"
            optionHoverColor="#F8FAFC"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#0A0E1A"
          />
        </div>

        {/* Date Filter */}
        <div className="relative flex items-center">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30">
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-left font-bold whitespace-nowrap min-w-[85px] sm:min-w-[95px]">
                {formattedDate}
              </span>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-3 rounded-2xl border border-[#E7E0D2] bg-white shadow-xl z-50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onSelectedDateChange(date);
                    setIsDatePopoverOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

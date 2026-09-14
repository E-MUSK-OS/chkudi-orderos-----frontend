"use client";

import { Search } from "lucide-react";
import ReactSelect from "@/components/ui/ReactSelect";
import DatePicker from "@/components/ui/DatePicker";

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
  return (
    <div className="mb-6 flex flex-col gap-4 border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm lg:flex-row lg:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px]">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Tracking ID..."
          className="
            h-11 sm:h-12
            w-full
            border
            border-[#E7E0D2]
            bg-white
            pl-10
            pr-4
            text-xs sm:text-sm
            text-[#0A0E1A]
            placeholder:text-slate-400
            outline-none
            transition
            focus:border-[#E8C16D]
            focus:ring-1
            focus:ring-[#E8C16D]
          "
        />
      </div>

      {/* Operator */}
      <div className="w-full lg:w-56">
        <ReactSelect
          options={operatorOptions}
          value={
            operatorOptions.find((x) => x.value === operator) ??
            operatorOptions[0]
          }
          onChange={(option) => onOperatorChange(option?.value ?? "")}
          placeholder="Operator"
          height={48}
          borderColor="#E7E0D2"
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

      {/* Account */}
      <div className="w-full lg:w-56">
        <ReactSelect
          options={accountOptions}
          value={
            accountOptions.find((x) => x.value === account) ?? accountOptions[0]
          }
          onChange={(option) => onAccountChange(option?.value ?? "")}
          placeholder="Account"
          height={48}
          borderColor="#E7E0D2"
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

      {/* Date */}
      <div className="relative">
        <DatePicker
          value={selectedDate}
          onChange={(date) => {
            if (date) {
              onSelectedDateChange(date);
            }
          }}
        />
      </div>
    </div>
  );
}

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
    <div className="mb-6 flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center">
      {/* Search */}

      <div className="relative w-full lg:max-w-sm">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Tracking ID..."
          className="
            h-12
            w-full
            border
            border-slate-700
            bg-[#111827]
            pl-11
            pr-4
            text-white
            outline-none
            transition
            focus:border-[#E8C16D]
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
          borderColor="#334155"
          backgroundColor="#111827"
          textColor="#ffffff"
          placeholderColor="#94A3B8"
          menuBackgroundColor="#111827"
          optionHoverColor="#1E293B"
          optionSelectedTextColor="#ffffff"
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
          borderColor="#334155"
          backgroundColor="#111827"
          textColor="#ffffff"
          placeholderColor="#94A3B8"
          menuBackgroundColor="#111827"
          optionHoverColor="#1E293B"
          optionSelectedTextColor="#ffffff"
        />
      </div>

      {/* Date */}

      <DatePicker
        value={selectedDate}
        onChange={(date) => {
          if (date) {
            onSelectedDateChange(date);
          }
        }}
      />
    </div>
  );
}

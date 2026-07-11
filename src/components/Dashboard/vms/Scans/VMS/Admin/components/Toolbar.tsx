"use client";

import { Search, RotateCw, Download } from "lucide-react";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";
import DateRangePicker from "@/components/ui/DateRangePicker";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  fromDate?: Date;
  toDate?: Date;

  onFromDateChange: (date?: Date) => void;
  onToDateChange: (date?: Date) => void;
  onDownload: () => void;

  onRefresh: () => void;
}

const statusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Completed",
    value: "COMPLETED",
  },
  {
    label: "Pending",
    value: "PENDING",
  },
  {
    label: "Failed",
    value: "FAILED",
  },
];

export default function Toolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  fromDate,
  toDate,

  onFromDateChange,
  onToDateChange,
  onDownload,

  onRefresh,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
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

        {/* Status */}

        <div className="w-full lg:w-56">
          <ReactSelect
            options={statusOptions}
            value={
              statusOptions.find((option) => option.value === status) ??
              statusOptions[0]
            }
            onChange={(option) => onStatusChange(option?.value ?? "")}
            placeholder="Status"
            height={48}
            borderColor="#334155"
            backgroundColor="#111827"
            textColor="#ffffff"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#111827"
            optionHoverColor="#1E293B"
            // optionSelectedColor="#2563EB"
            optionSelectedTextColor="#ffffff"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <DateRangePicker
            from={fromDate}
            to={toDate}
            onChange={(range) => {
              onFromDateChange(range.from);
              onToDateChange(range.to);
            }}
          />
        </div>
      </div>

      {/* Right */}

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          fullWidth={false}
          leftIcon={<Download size={18} />}
          onClick={onDownload}
        >
          Download
        </Button>

        <Button
          variant="secondary"
          fullWidth={false}
          leftIcon={<RotateCw size={18} />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

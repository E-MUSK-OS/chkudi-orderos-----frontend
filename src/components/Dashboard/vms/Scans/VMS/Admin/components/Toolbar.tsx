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
  operator,
  onOperatorChange,
  operatorOptions,
  account,
  onAccountChange,
  accountOptions,
  fromDate,
  toDate,

  onFromDateChange,
  onToDateChange,
  onDownload,

  onRefresh,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm rounded-xl lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        {/* Search */}

        <div className="relative w-full lg:max-w-sm">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Tracking ID..."
            className="
              h-12
              w-full
              border
              border-[#E7E0D2]
              bg-white
              pl-11
              pr-4
              text-slate-800
              placeholder:text-slate-400
              outline-none
              transition
              focus:border-[#E8C16D]
              focus:ring-1
              focus:ring-[#E8C16D]
              rounded-lg
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
            borderColor="#E7E0D2"
            backgroundColor="#ffffff"
            textColor="#0A0E1A"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#ffffff"
            optionHoverColor="#FDFBF7"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#0A0E1A"
            borderRadius={8}
          />
        </div>

        <div className="w-full lg:w-56">
          <ReactSelect
            options={operatorOptions}
            value={
              operatorOptions.find((option) => option.value === operator) ??
              operatorOptions[0]
            }
            onChange={(option) => onOperatorChange(option?.value ?? "")}
            placeholder="Operator"
            height={48}
            borderColor="#E7E0D2"
            backgroundColor="#ffffff"
            textColor="#0A0E1A"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#ffffff"
            optionHoverColor="#FDFBF7"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#0A0E1A"
            borderRadius={8}
          />
        </div>

        <div className="w-full lg:w-56">
          <ReactSelect
            options={accountOptions}
            value={
              accountOptions.find((option) => option.value === account) ??
              accountOptions[0]
            }
            onChange={(option) => onAccountChange(option?.value ?? "")}
            placeholder="Account"
            height={48}
            borderColor="#E7E0D2"
            backgroundColor="#ffffff"
            textColor="#0A0E1A"
            placeholderColor="#94A3B8"
            menuBackgroundColor="#ffffff"
            optionHoverColor="#FDFBF7"
            optionSelectedColor="#E8C16D"
            optionSelectedTextColor="#0A0E1A"
            optionTextColor="#0A0E1A"
            borderRadius={8}
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
          className="bg-[#E8C16D] text-[#0A0E1A] font-semibold hover:bg-[#ddb75d] shadow-sm rounded-lg"
        >
          Download
        </Button>

        <Button
          variant="secondary"
          fullWidth={false}
          leftIcon={<RotateCw size={18} />}
          onClick={onRefresh}
          className="bg-[#E8C16D] text-[#0A0E1A] font-semibold hover:bg-[#ddb75d] shadow-sm rounded-lg"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Search, RotateCw, Download } from "lucide-react";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  country: string;
  onCountryChange: (value: string) => void;

  isDefault: string;
  onIsDefaultChange: (value: string) => void;

  countryOptions: {
    label: string;
    value: string;
  }[];

  onDownload: () => void;
  onRefresh: () => void;
}

const statusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Active",
    value: "true",
  },
  {
    label: "Inactive",
    value: "false",
  },
];

const defaultOptions = [
  {
    label: "All Warehouses",
    value: "",
  },
  {
    label: "Default",
    value: "true",
  },
  {
    label: "Non Default",
    value: "false",
  },
];

export default function WarehouseToolbar({
  search,
  onSearchChange,

  status,
  onStatusChange,

  country,
  onCountryChange,

  isDefault,
  onIsDefaultChange,

  countryOptions,

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
            placeholder="Search Warehouse..."
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

        <div className="w-full lg:w-52">
          <ReactSelect
            options={statusOptions}
            value={
              statusOptions.find(
                (option) => option.value === status
              ) ?? statusOptions[0]
            }
            onChange={(option) =>
              onStatusChange(option?.value ?? "")
            }
            placeholder="Status"
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

        <div className="w-full lg:w-56">
          <ReactSelect
            options={defaultOptions}
            value={
              defaultOptions.find(
                (option) => option.value === isDefault
              ) ?? defaultOptions[0]
            }
            onChange={(option) =>
              onIsDefaultChange(option?.value ?? "")
            }
            placeholder="Default"
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
      </div>

      <div className="flex items-center justify-end gap-3">

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
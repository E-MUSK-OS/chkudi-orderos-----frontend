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
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Left */}

      <div className="flex flex-1 flex-col gap-3.5 sm:gap-4 lg:flex-row">
        {/* Search */}

        <div className="group relative flex h-11 w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-2xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:border-white/[0.08] dark:bg-[#080B11] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/20 lg:max-w-sm">
          <Search
            size={18}
            className="text-slate-400 transition-colors group-focus-within:text-[#B88728] dark:text-slate-500 dark:group-focus-within:text-[#F5C451] shrink-0"
          />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Warehouse..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
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
            height={44}
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
            height={44}
          />
        </div>
      </div>

      <div className="flex items-center justify-stretch sm:justify-end gap-3 w-full lg:w-auto">
        <Button
          variant="secondary"
          fullWidth={false}
          className="w-full sm:w-auto rounded-2xl active:scale-[0.98]"
          leftIcon={<RotateCw size={18} />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
"use client";

import { Search, RotateCw } from "lucide-react";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";

interface Option {
  label: string;
  value: string;
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;

  brand: string;
  onBrandChange: (value: string) => void;

  categoryOptions: Option[];
  brandOptions: Option[];

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

export default function ProductToolbar({
  search,
  onSearchChange,

  status,
  onStatusChange,

  category,
  onCategoryChange,

  brand,
  onBrandChange,

  categoryOptions,
  brandOptions,

  onRefresh,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center lg:justify-between">
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
            placeholder="Search Product..."
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

        {/* Category */}

        <div className="w-full lg:w-56">
          <ReactSelect
            options={categoryOptions}
            value={
              categoryOptions.find(
                (option) => option.value === category
              ) ?? categoryOptions[0]
            }
            onChange={(option) =>
              onCategoryChange(option?.value ?? "")
            }
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

        {/* Brand */}

        <div className="w-full lg:w-56">
          <ReactSelect
            options={brandOptions}
            value={
              brandOptions.find(
                (option) => option.value === brand
              ) ?? brandOptions[0]
            }
            onChange={(option) =>
              onBrandChange(option?.value ?? "")
            }
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

      <div className="flex justify-end">
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
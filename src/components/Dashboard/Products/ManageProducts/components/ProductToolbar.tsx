"use client";

import { useRef } from "react";
import { Search, RotateCw, FileSpreadsheet } from "lucide-react";

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

  onImportExcel?: (file: File) => void;
  isImporting?: boolean;
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

  onImportExcel,
  isImporting = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
      e.target.value = "";
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-700 bg-[#0F172A] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between shadow-sm">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-1 xl:items-center xl:gap-4">
        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
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
              rounded-md
              border
              border-slate-700
              bg-[#111827]
              pl-11
              pr-4
              text-sm
              text-white
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          />
        </div>

        {/* Status */}
        <div className="w-full xl:w-48">
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
        <div className="w-full xl:w-52">
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
        <div className="w-full xl:w-52">
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

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-stretch sm:justify-end gap-2.5 sm:gap-3 w-full xl:w-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />

        <Button
          variant="secondary"
          fullWidth={false}
          className="flex-1 sm:flex-none"
          leftIcon={<FileSpreadsheet size={18} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import Excel"}
        </Button>

        <Button
          variant="secondary"
          fullWidth={false}
          className="flex-1 sm:flex-none"
          leftIcon={<RotateCw size={18} />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
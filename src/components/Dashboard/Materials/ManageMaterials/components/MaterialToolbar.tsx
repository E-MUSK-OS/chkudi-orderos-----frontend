"use client";

import { useRef } from "react";
import {
  Download,
  RotateCw,
  Search,
  Upload,
  X,
  Layers,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { validateImportSheetFormat } from "../utils/validateImportSheet";
import { downloadDemoSheet } from "../utils/downloadDemoSheet";
import { exportMaterialsExcel } from "../utils/exportMaterialsExcel";

interface Option {
  label: string;
  value: string;
}

export type ImportType = "material" | "asin" | "myntra";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;

  brand: string;
  onBrandChange: (value: string) => void;

  marketplace?: string;
  onMarketplaceChange?: (value: string) => void;

  importType: ImportType;
  onImportTypeChange: (value: ImportType) => void;

  categoryOptions?: Option[];
  brandOptions: Option[];
  marketplaceOptions?: Option[];

  onRefresh: () => void;

  onImportExcel?: (file: File, type: ImportType) => void;
  isImporting?: boolean;

  materialsData?: any[];
  asinData?: any[];
  myntraData?: any[];

  selectedCount?: number;
  onExportMaterials?: () => void;
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

export default function MaterialToolbar({
  search,
  onSearchChange,

  status,
  onStatusChange,

  category,
  onCategoryChange,

  brand,
  onBrandChange,

  marketplace = "",
  onMarketplaceChange,

  importType,
  onImportTypeChange,

  categoryOptions,
  brandOptions,
  marketplaceOptions = [],

  onRefresh,

  onImportExcel,
  isImporting = false,
  materialsData = [],
  asinData = [],
  myntraData = [],
  selectedCount = 0,
  onExportMaterials,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTypeRef = useRef<ImportType>(importType);
  selectedTypeRef.current = importType;

  const handleDownloadDemoSheet = () => {
    downloadDemoSheet("material");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImportSheetFormat(file, "material");

    if (!validation.valid) {
      toast.error(
        validation.message || "Please upload the appropriate sheet format for Material Import!"
      );
      e.target.value = "";
      return;
    }

    if (onImportExcel) {
      onImportExcel(file, "material");
      e.target.value = "";
    }
  };

  const handleDownloadData = async () => {
    try {
      if (onExportMaterials) {
        onExportMaterials();
        return;
      }

      await exportMaterialsExcel(
        materialsData || [],
        Boolean(selectedCount && selectedCount > 0)
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to download data");
    }
  };

  const isFilterActive =
    (search && search.trim() !== "") ||
    Boolean(status) ||
    Boolean(category);

  const handleResetFilters = () => {
    onSearchChange("");
    onStatusChange("");
    onCategoryChange("");
    onBrandChange?.("");
    onMarketplaceChange?.("");
  };

  const hasData = Boolean(materialsData && materialsData.length > 0);

  return (
    <>
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 dark:border-white/[0.08] dark:bg-[#0F1626]">
        {/* Left side: Searchbar matching OrderOS pill theme */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            placeholder="Search Material / SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right side: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Status Dropdown Pill */}
          <ThemeSelectDropdown
            ariaLabel="Filter by Status"
            value={status}
            onChange={(val) => onStatusChange(val)}
            options={statusOptions}
            buttonClassName="rounded-full h-10 px-4 text-xs font-semibold bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.1] hover:border-[#E8C16D]"
            icon={<Boxes className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />}
          />

          {/* Category Search Pill */}
          <div className="relative min-w-[170px] max-w-[220px]">
            <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <input
              type="text"
              placeholder="Search Category..."
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 transition-all shadow-xs"
            />
            {category && (
              <button
                type="button"
                onClick={() => onCategoryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear category search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Reset filter pill button if active */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Upload Button Pill */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] hover:border-[#E8C16D] text-slate-800 dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
            title="Import Excel file"
          >
            <Upload className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            <span>{isImporting ? "Importing..." : "Import"}</span>
          </button>

          {/* Export / Demo Button Pill */}
          {hasData ? (
            <button
              type="button"
              onClick={handleDownloadData}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#252014] active:scale-[0.98] cursor-pointer"
              title={
                importType === "material" && selectedCount > 0
                  ? `Export ${selectedCount} selected material(s)`
                  : "Export data"
              }
            >
              <Download className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>
                {importType === "material" && selectedCount > 0
                  ? `Export (${selectedCount})`
                  : "Export"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadDemoSheet}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] hover:border-[#E8C16D] text-slate-800 dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              title="Download demo Excel sheet"
            >
              <Download className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Demo Sheet</span>
            </button>
          )}

          {/* Refresh Button Pill */}
          <button
            type="button"
            onClick={onRefresh}
            className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            title="Refresh"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </>
  );
}

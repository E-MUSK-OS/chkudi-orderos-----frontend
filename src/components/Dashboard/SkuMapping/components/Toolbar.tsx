"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Search, Upload, X } from "lucide-react";
import {
  downloadDemoSheet,
  downloadAllRecordsSheet,
} from "../utils/skuExcelUtils";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  total: number;
  onImport: () => void;
  onGenerateSheet: () => void;
}

export default function Toolbar({
  search,
  onSearchChange,
  total,
  onImport,
  onGenerateSheet,
}: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (total > 0) {
      setIsExporting(true);
      try {
        await downloadAllRecordsSheet(search);
      } finally {
        setIsExporting(false);
      }
    } else {
      await downloadDemoSheet();
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
      {/* Left side: Searchbar matching OrderOS theme */}
      <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
        <div className="group flex h-10 sm:h-11 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Short SKU, Full SKU, Barcode SKU..."
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

      {/* Right side: Total and Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Total Badge */}
        <div className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl border border-[#E7E0D2] bg-slate-50/80 px-3.5 sm:px-4 shadow-xs">
          <span className="text-xs sm:text-sm font-semibold text-slate-500">Total:</span>
          <span className="rounded-lg bg-[#0A0E1A] px-2.5 py-0.5 text-xs sm:text-sm font-bold text-[#E8C16D]">
            {total}
          </span>
        </div>

        {/* Generate Sheet */}
        <button
          type="button"
          onClick={onGenerateSheet}
          className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-[#B88728]" />
          <span>Generate Sheet</span>
        </button>

        {/* Download Sheet / Demo Sheet */}
        {total > 0 ? (
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#B88728]" />
            ) : (
              <Download className="h-4 w-4 text-[#B88728]" />
            )}
            <span>Download Sheet</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
            title="Download sample Excel template"
          >
            <Download className="h-4 w-4 text-[#B88728]" />
            <span>Demo Sheet</span>
          </button>
        )}

        {/* Import Excel */}
        <button
          type="button"
          onClick={onImport}
          className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Import Excel</span>
        </button>
      </div>
    </div>
  );
}

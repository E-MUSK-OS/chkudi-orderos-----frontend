"use client";

import { useState } from "react";
import { Download, Loader2, Search, Upload } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
          />

          <Input
            value={search}
            placeholder="Search Short SKU / Full SKU / Barcode SKU / OrderCook SKU"
            className="h-11 pl-10 text-sm"
            containerClassName="space-y-0"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4">
          <span className="text-sm font-medium text-slate-500">Total</span>

          <span className="rounded bg-[#0A0E1A] px-2 py-0.5 text-sm font-semibold text-[#E8C16D]">
            {total}
          </span>
        </div>

        <Button
          variant="outline"
          fullWidth={false}
          className="h-11 px-5 text-sm rounded-lg whitespace-nowrap"
          onClick={onGenerateSheet}
        >
          Generate Sheet
        </Button>

        {total > 0 ? (
          <Button
            variant="outline"
            fullWidth={false}
            disabled={isExporting}
            onClick={handleExport}
            className="h-11 px-5 text-sm rounded-lg whitespace-nowrap flex items-center gap-2 border-[#C89B3C]/50 text-[#C89B3C] hover:bg-[#FFF8E7] hover:border-[#C89B3C]"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Download Sheet
          </Button>
        ) : (
          <Button
            variant="outline"
            fullWidth={false}
            onClick={handleExport}
            className="h-11 px-5 text-sm rounded-lg whitespace-nowrap flex items-center gap-2 border-[#C89B3C]/50 text-[#C89B3C] hover:bg-[#FFF8E7] hover:border-[#C89B3C]"
          >
            <Download size={16} />
            Demo Sheet
          </Button>
        )}

        <Button
          fullWidth={false}
          className="h-11 px-5 text-sm rounded-lg whitespace-nowrap flex items-center gap-2"
          onClick={onImport}
        >
          <Upload size={16} />
          Import Excel
        </Button>
      </div>
    </div>
  );
}

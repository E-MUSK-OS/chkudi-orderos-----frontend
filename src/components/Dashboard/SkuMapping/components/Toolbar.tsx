"use client";

import { Search, Upload } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
  return (
    <div className="flex flex-col gap-4 border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="flex flex-1 items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            placeholder="Search Short SKU / Barcode SKU / OrderCook SKU"
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right */}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-md text-slate-500">Total</span>

          <span className="bg-[#0A0E1A] px-2 py-0.5 text-md font-semibold text-[#E8C16D]">
            {total}
          </span>
        </div>

        <Button variant="outline" onClick={onGenerateSheet}>
          Generate Sheet
        </Button>

        <Button onClick={onImport} className="flex items-center gap-2">
          <Upload size={16} />
          Import Excel
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Download, RotateCcw, Search, Upload } from "lucide-react";
import { FileUp, FileDown } from "lucide-react";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import type { InventoryFilters } from "../types/inventory.types";
import { useState } from "react";
import ImportInventoryModal from "./ImportInventoryModal";

interface Props {
  filters: InventoryFilters;

  setFilters: React.Dispatch<React.SetStateAction<InventoryFilters>>;

  onRefresh: () => void;

  onExport: () => void;
  isExporting: boolean;
}

const InventoryToolbar = ({
  filters,
  setFilters,
  onRefresh,
  onExport,
  isExporting,
}: Props) => {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 border bg-[#0A0E1A] p-4 lg:flex-row lg:items-center lg:justify-between">
      {/* ====================================================== */}
      {/* Search */}
      {/* ====================================================== */}

      <div className="relative w-full lg:max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <Input
          placeholder="Search Product / SKU..."
          value={filters.search ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              search: e.target.value,
            }))
          }
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

      {/* ====================================================== */}
      {/* Actions */}
      {/* ====================================================== */}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <FileUp size={16} className="mr-2" />
          Import
        </Button>

        <Button variant="outline" onClick={onExport} loading={isExporting}>
          <FileDown size={16} className="mr-2" />
          Export
        </Button>
        <Button variant="secondary" onClick={onRefresh}>
          <RotateCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
      <ImportInventoryModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
};

export default InventoryToolbar;

"use client";

import { Download, RotateCcw, Search, Upload } from "lucide-react";
import { FileUp, FileDown } from "lucide-react";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import type { InventoryFilters } from "../types/inventory.types";
import { useState } from "react";
import { useWarehouses } from "@/components/Dashboard/Warehouse/hooks/useWarehouse";
import ImportInventoryModal from "./ImportInventoryModal";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { ArrowRightLeft } from "lucide-react";
import CreateTransferModal from "../../Transfer/components/CreateTransferModal";

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
  const [transferOpen, setTransferOpen] = useState(false);
  const { data: warehouseResponse } = useWarehouses();

  const warehouseOptions: SelectOption[] = [
    {
      label: "All Warehouses",
      value: "",
    },

    ...(warehouseResponse?.data?.map((warehouse) => ({
      label: warehouse.warehouseName,
      value: warehouse.id,
    })) ?? []),
  ];
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

      <div className="w-full lg:w-72">
        <ReactSelect
          options={warehouseOptions}
          value={
            warehouseOptions.find(
              (option) => option.value === (filters.warehouseId ?? ""),
            ) ?? warehouseOptions[0]
          }
          onChange={(option) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              warehouseId: option?.value ?? "",
            }))
          }
          placeholder="Select Warehouse"
        />
      </div>

      {/* ====================================================== */}
      {/* Actions */}
      {/* ====================================================== */}

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => setTransferOpen(true)}>
          <ArrowRightLeft size={16} className="mr-2" />
          Transfer
        </Button>

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

      <CreateTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </div>
  );
};

export default InventoryToolbar;

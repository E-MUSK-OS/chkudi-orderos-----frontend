"use client";

import { useState } from "react";
import {
  Download,
  RotateCcw,
  Search,
  Upload,
  ArrowRightLeft,
  X,
  Warehouse,
  Boxes,
} from "lucide-react";

import type { InventoryFilters } from "../types/inventory.types";
import { useWarehouses } from "@/components/Dashboard/Warehouse/hooks/useWarehouse";
import ImportInventoryModal from "./ImportInventoryModal";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import CreateTransferModal from "../../Transfer/components/CreateTransferModal";
import { usePagePermissions } from "@/utils/pagePermissions";

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
  const { canCreate } = usePagePermissions("products/inventory");
  const { data: warehouseResponse } = useWarehouses();

  const warehouseOptions = [
    {
      label: "All Warehouses",
      value: "",
    },
    ...(warehouseResponse?.data?.map((warehouse) => ({
      label: warehouse.warehouseName,
      value: warehouse.id,
    })) ?? []),
  ];

  const statusOptions = [
    {
      label: "All Status",
      value: "",
    },
    {
      label: "In Stock",
      value: "IN_STOCK",
    },
    {
      label: "Low Stock",
      value: "LOW_STOCK",
    },
    {
      label: "Out of Stock",
      value: "OUT_OF_STOCK",
    },
  ];

  const renderSearch = (className = "w-full transition-all") => (
    <div className={className}>
      <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/30 dark:focus-within:bg-[#0B0F17]">
        <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
          <Search className="h-3.5 w-3.5" />
        </div>
        <input
          type="text"
          placeholder="Search Product / SKU..."
          value={filters.search ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              search: e.target.value,
            }))
          }
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                search: "",
              }))
            }
            className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0 dark:text-slate-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const renderWarehouse = (className = "shrink-0") => (
    <div className={className}>
      <ThemeSelectDropdown
        ariaLabel="Filter by Warehouse"
        value={filters.warehouseId ?? ""}
        onChange={(val) =>
          setFilters((prev) => ({
            ...prev,
            page: 1,
            warehouseId: val,
          }))
        }
        options={warehouseOptions}
        icon={<Warehouse className="h-3.5 w-3.5" />}
      />
    </div>
  );

  const renderStatus = (className = "shrink-0") => (
    <div className={className}>
      <ThemeSelectDropdown
        ariaLabel="Filter by Status"
        value={filters.status ?? ""}
        onChange={(val) =>
          setFilters((prev) => ({
            ...prev,
            page: 1,
            status: val,
          }))
        }
        options={statusOptions}
        icon={<Boxes className="h-3.5 w-3.5" />}
      />
    </div>
  );

  const renderActions = (className = "flex items-center gap-1.5 sm:gap-2.5 shrink-0") => (
    <div className={className}>
      {/* Transfer Button */}
      <button
        type="button"
        onClick={() => setTransferOpen(true)}
        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] active:scale-[0.98] shrink-0 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
      >
        <div className="grid h-4.5 w-4.5 sm:h-5 sm:w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
          <ArrowRightLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </div>
        <span>Transfer</span>
      </button>

      {/* Import Button */}
      {canCreate && (
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] active:scale-[0.98] shrink-0 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
        >
          <div className="grid h-4.5 w-4.5 sm:h-5 sm:w-5 place-items-center rounded-md bg-slate-100 text-slate-700 shrink-0 dark:bg-white/[0.06] dark:text-slate-300">
            <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
          <span>Import</span>
        </button>
      )}

      {/* Export Button */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 dark:border-[#F5C451]/50 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:ring-[#F5C451]/20 dark:hover:bg-[#F5C451]/25"
        title="Export inventory"
      >
        <div className="grid h-4.5 w-4.5 sm:h-5 sm:w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#F5C451]/20 dark:text-[#F5C451]">
          <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </div>
        <span>{isExporting ? "Exporting..." : "Export"}</span>
      </button>

      {/* Refresh / Reset Button */}
      <button
        type="button"
        onClick={() => {
          setFilters((prev) => ({
            ...prev,
            page: 1,
            search: "",
            warehouseId: "",
            status: "",
          }));
          onRefresh();
        }}
        className="inline-flex items-center justify-center h-8.5 sm:h-10 w-8.5 sm:w-10 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 transition-all shadow-xs active:scale-[0.98] cursor-pointer shrink-0 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
        title="Reset & Refresh Inventory"
      >
        <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
        {/* Desktop View (xl: and above >= 1280px / 1440px / 1920px): Single Row */}
        <div className="hidden xl:flex xl:items-center xl:justify-between gap-3 sm:gap-4">
          {renderSearch("w-72 xl:w-80 2xl:w-96 transition-all")}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {renderWarehouse()}
            {renderStatus()}
            {renderActions()}
          </div>
        </div>

        {/* Laptop / Tablet / Mobile View (< xl, e.g. 1024px): 2 Balanced Rows */}
        <div className="xl:hidden space-y-2.5 sm:space-y-3">
          {/* Row 1: Search + Warehouse + Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {renderSearch("flex-1 min-w-[200px]")}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {renderWarehouse()}
              {renderStatus()}
            </div>
          </div>

          {/* Row 2: Action Buttons (left-aligned across tablet & laptop views) */}
          <div className="flex items-center justify-start">
            {renderActions("flex flex-wrap items-center gap-1.5 sm:gap-2.5")}
          </div>
        </div>
      </div>

      <ImportInventoryModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <CreateTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />
    </>
  );
};

export default InventoryToolbar;

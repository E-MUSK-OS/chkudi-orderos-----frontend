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

  const isFilterActive =
    (filters.search && filters.search.trim() !== "") ||
    Boolean(filters.warehouseId) ||
    Boolean(filters.status);

  return (
    <>
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 dark:border-white/[0.08] dark:bg-[#0F1626]">
        {/* Left side: Searchbar matching OrderOS theme with increased width */}
        <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
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

        {/* Right side: Filters & Actions matching Amazon Analytics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Warehouse Dropdown */}
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

          {/* Status Dropdown */}
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

          {/* Reset filter button if active */}
          {isFilterActive && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  search: "",
                  warehouseId: "",
                  status: "",
                }))
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 hover:text-red-700 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
              title="Reset all filters"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 text-red-600 shrink-0 dark:bg-red-500/20 dark:text-red-400">
                <X className="h-3.5 w-3.5" />
              </div>
              <span>Reset</span>
            </button>
          )}

          {/* Transfer Button */}
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </div>
            <span>Transfer</span>
          </button>

          {/* Import Button */}
          {canCreate && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] active:scale-[0.98] dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-slate-700 shrink-0 dark:bg-white/[0.06] dark:text-slate-300">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <span>Import</span>
          </button>

          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer disabled:opacity-50 dark:border-[#F5C451]/50 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:ring-[#F5C451]/20 dark:hover:bg-[#F5C451]/25"
            title="Export inventory"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF3D6] text-[#B88728] shrink-0 dark:bg-[#F5C451]/20 dark:text-[#F5C451]">
              <Download className="h-3.5 w-3.5" />
            </div>
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center h-9 sm:h-10 w-9 sm:w-10 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 transition-all shadow-xs active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            title="Refresh Inventory"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
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

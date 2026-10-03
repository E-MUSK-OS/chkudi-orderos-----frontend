"use client";

import { useState, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Warehouse,
  Boxes,
} from "lucide-react";

import {
  useInventories,
  useUpdateInventory,
  useAdjustInventory,
  useDeleteInventory,
  useExportInventory,
} from "./hooks/useInventories";

import type { Inventory, InventoryFilters } from "./types/inventory.types";

import InventoryToolbar from "./components/InventoryToolbar";
import DashboardLayout from "../../layout/DashboardLayout";
import InventoryTable from "./components/InventoryTable";
import InventoryModal from "./components/InventoryModal";
import AdjustInventoryModal from "./components/AdjustInventoryModal";
import DeleteInventoryModal from "./components/DeleteInventoryModal";

const InventoryPage = () => {
  // ======================================================
  // Filters
  // ======================================================

  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 10,
    search: "",
    warehouseId: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // ======================================================
  // Selected Inventory
  // ======================================================

  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null,
  );

  // ======================================================
  // Modals
  // ======================================================

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ======================================================
  // Query
  // ======================================================

  const { data, isLoading, isError, refetch } = useInventories(filters);
  const exportInventoryMutation = useExportInventory();

  const inventories =
    data?.data?.filter((inventory) => {
      switch (filters.status) {
        case "OUT_OF_STOCK":
          return inventory.availableStock === 0;

        case "LOW_STOCK":
          return (
            inventory.availableStock > 0 &&
            inventory.availableStock <= inventory.reorderLevel
          );

        case "IN_STOCK":
          return inventory.availableStock > inventory.reorderLevel;

        default:
          return true;
      }
    }) ?? [];

  // ======================================================
  // KPI Statistics
  // ======================================================

  const stats = useMemo(() => {
    const list = data?.data ?? [];
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalAvailable = 0;
    let totalReserved = 0;

    list.forEach((item) => {
      totalAvailable += item.availableStock || 0;
      totalReserved += item.reservedStock || 0;
      if (item.availableStock === 0) {
        outOfStock++;
      } else if (item.availableStock <= item.reorderLevel) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      totalItems: data?.pagination?.total ?? list.length,
      inStock,
      lowStock,
      outOfStock,
      totalAvailable,
      totalReserved,
    };
  }, [data]);

  // ======================================================
  // Render
  // ======================================================

  return (
    <DashboardLayout title="Inventory">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Information Banner matching Product Analytics Amazon */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                    Product Inventory
                  </h1>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Track real-time stock levels, allocations, and inventory transfers.
              </p>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-5 sm:pt-6">
            {/* Total Records */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Total Items</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
                  {stats.totalItems.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  Records
                </span>
              </div>
            </article>

            {/* Total Available Units */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Available Units</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
                  {stats.totalAvailable.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-amber-200/60 bg-[#FFF9EC] px-2.5 py-1 text-xs font-bold text-[#B88728]">
                  Units
                </span>
              </div>
            </article>

            {/* In Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">In Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {stats.inStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  Healthy
                </span>
              </div>
            </article>

            {/* Low Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Low Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-amber-600">
                  {stats.lowStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  Reorder
                </span>
              </div>
            </article>

            {/* Out of Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Out of Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600">
                  {stats.outOfStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-rose-200/60 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                  Zero Stock
                </span>
              </div>
            </article>
          </div>
        </div>

        <InventoryToolbar
          filters={filters}
          setFilters={setFilters}
          onRefresh={refetch}
          onExport={() => exportInventoryMutation.mutate(filters)}
          isExporting={exportInventoryMutation.isPending}
        />

        <InventoryTable
          // inventories={data?.data ?? []}
          inventories={inventories}
          pagination={data?.pagination}
          isLoading={isLoading}
          isError={isError}
          onEdit={(inventory) => {
            setSelectedInventory(inventory);
            setIsUpdateOpen(true);
          }}
          onAdjust={(inventory) => {
            setSelectedInventory(inventory);
            setIsAdjustOpen(true);
          }}
          onDelete={(inventory) => {
            setSelectedInventory(inventory);
            setIsDeleteOpen(true);
          }}
          onPageChange={(page) =>
            setFilters((prev) => ({
              ...prev,
              page,
            }))
          }
          onPageSizeChange={(limit) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              limit,
            }))
          }
        />

        <InventoryModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          inventory={selectedInventory}
        />

        <AdjustInventoryModal
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          inventory={selectedInventory}
        />

        <DeleteInventoryModal
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          inventory={selectedInventory}
        />
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;

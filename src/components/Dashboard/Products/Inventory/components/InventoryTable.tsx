"use client";

import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { Inventory, InventoryPagination } from "../types/inventory.types";
import InventoryActionMenu from "./InventoryActionMenu";
import Pagination from "@/components/ui/Pagination";

interface Props {
  inventories: Inventory[];
  pagination?: InventoryPagination;
  isLoading: boolean;
  isError: boolean;
  onEdit: (inventory: Inventory) => void;
  onAdjust: (inventory: Inventory) => void;
  onDelete: (inventory: Inventory) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const InventoryTable = ({
  inventories,
  pagination,
  isLoading,
  isError,
  onEdit,
  onAdjust,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
        <RefreshCw className="h-8 w-8 animate-spin text-[#B88728]" />
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Loading inventories...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-rose-200 bg-rose-50/40 p-10 text-center shadow-sm">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-rose-800">
          Failed to load inventories
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-rose-600 max-w-md">
          An error occurred while fetching inventory data. Please try refreshing.
        </p>
      </div>
    );
  }

  if (!inventories.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30">
          <Boxes className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A]">
          No Inventories Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
          No inventory records matched your search or filter criteria. Try clearing your filters or adding new inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[950px] lg:min-w-[1100px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap w-[240px] max-w-[280px]">
                Product
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap w-[150px] min-w-[130px]">
                Variant SKU
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">
                Warehouse
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
                Available
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
                Reserved
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
                Incoming
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
                Damaged
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
                Reorder
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[130px]">
                Status
              </th>
              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
            {inventories.map((inventory) => {
              const isOutOfStock = inventory.availableStock === 0;
              const isLowStock =
                !isOutOfStock &&
                inventory.availableStock <= inventory.reorderLevel;

              return (
                <tr
                  key={inventory.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Product */}
                  <td className="px-3 sm:px-4 py-3.5 text-left max-w-[280px]">
                    <div
                      className="font-bold text-[#0A0E1A] truncate"
                      title={inventory.productVariant?.product?.productName}
                    >
                      {inventory.productVariant?.product?.productName ||
                        "Unnamed Product"}
                    </div>
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                      {inventory.productVariant?.product?.masterSku || "-"}
                    </div>
                  </td>

                  {/* Variant SKU */}
                  <td className="px-3 sm:px-4 py-3.5 text-left whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 font-mono">
                      {inventory.productVariant?.variantSku || "-"}
                    </span>
                  </td>

                  {/* Warehouse */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {inventory.warehouse?.warehouseName || "-"}
                      </span>
                      {inventory.warehouse?.warehouseCode && (
                        <span className="mt-1 inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200/60">
                          {inventory.warehouse.warehouseCode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Available */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isOutOfStock
                          ? "text-rose-600"
                          : isLowStock
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {inventory.availableStock?.toLocaleString() ?? 0}
                    </span>
                  </td>

                  {/* Reserved */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {inventory.reservedStock?.toLocaleString() ?? 0}
                    </span>
                  </td>

                  {/* Incoming */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {inventory.incomingStock?.toLocaleString() ?? 0}
                    </span>
                  </td>

                  {/* Damaged */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        (inventory.damagedStock || 0) > 0
                          ? "text-rose-600 font-bold"
                          : "text-slate-800"
                      }`}
                    >
                      {inventory.damagedStock?.toLocaleString() ?? 0}
                    </span>
                  </td>

                  {/* Reorder Level */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {inventory.reorderLevel?.toLocaleString() ?? 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        In Stock
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-3 sm:px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center">
                      <InventoryActionMenu
                        inventory={inventory}
                        onEdit={onEdit}
                        onAdjust={onAdjust}
                        onDelete={onDelete}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination?.page ?? 1}
        totalPages={pagination?.totalPages ?? 1}
        totalRecords={pagination?.total ?? 0}
        pageSize={pagination?.limit ?? 10}
        itemName="inventories"
        variant="dark"
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5 mt-auto"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default InventoryTable;

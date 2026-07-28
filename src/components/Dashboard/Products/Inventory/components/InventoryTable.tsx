"use client";

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
      <div className="border bg-white p-8 text-center">
        Loading inventories...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border bg-white p-8 text-center text-red-500">
        Failed to load inventories.
      </div>
    );
  }

  if (!inventories.length) {
    return (
      <div className="border bg-white p-8 text-center">
        No inventories found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0A0E1A] text-white text-lg">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>

              <th className="px-4 py-3 text-left">Variant SKU</th>

              <th className="px-4 py-3 text-left">Warehouse</th>

              <th className="px-4 py-3 text-center">Available</th>

              <th className="px-4 py-3 text-center">Reserved</th>

              <th className="px-4 py-3 text-center">Incoming</th>

              <th className="px-4 py-3 text-center">Damaged</th>

              <th className="px-4 py-3 text-center">Reorder</th>

              <th className="px-4 py-3 text-center">Status</th>

              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {inventories.map((inventory) => {
              const status =
                inventory.availableStock === 0
                  ? "Out of Stock"
                  : inventory.availableStock <= inventory.reorderLevel
                    ? "Low Stock"
                    : "In Stock";

              return (
                <tr key={inventory.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {inventory.productVariant.product.productName}
                    </div>

                    <div className="text-sm text-gray-500">
                      {inventory.productVariant.product.masterSku}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {inventory.productVariant.variantSku}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">
                        {inventory.warehouse.warehouseName}
                      </span>

                      <span className="mt-1 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {inventory.warehouse.warehouseCode}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        inventory.availableStock === 0
                          ? "text-red-600"
                          : inventory.availableStock <= inventory.reorderLevel
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {inventory.availableStock}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {inventory.reservedStock}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {inventory.incomingStock}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {inventory.damagedStock}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {inventory.reorderLevel}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        inventory.availableStock === 0
                          ? "bg-red-100 text-red-700"
                          : inventory.availableStock <= inventory.reorderLevel
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center flex justify-center">
                    <InventoryActionMenu
                      inventory={inventory}
                      onEdit={onEdit}
                      onAdjust={onAdjust}
                      onDelete={onDelete}
                    />
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
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default InventoryTable;

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

                  <td className="px-4 py-3 text-center">
                    {inventory.availableStock}
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

                  <td className="px-4 py-3 text-center">{status}</td>

                  <td className="px-4 py-3 text-center">
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

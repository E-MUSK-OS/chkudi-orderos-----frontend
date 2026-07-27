"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import { useDeleteInventory } from "../hooks/useInventories";
import type { Inventory } from "../types/inventory.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
}

export default function DeleteInventoryModal({
  open,
  onOpenChange,
  inventory,
}: Props) {
  const { mutate, isPending } = useDeleteInventory();

  const handleDelete = () => {
    if (!inventory) return;

    mutate(inventory.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Delete Inventory"
      description="This action cannot be undone."
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            fullWidth={false}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            fullWidth={false}
            loading={isPending}
            onClick={handleDelete}
          >
            Delete Inventory
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-700">
            Are you sure?
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            You are about to permanently delete this inventory record.
          </p>
        </div>

        {inventory && (
          <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
            <div>
              <span className="text-sm text-slate-500">
                Product
              </span>

              <p className="font-medium">
                {inventory.productVariant.product.productName}
              </p>
            </div>

            <div>
              <span className="text-sm text-slate-500">
                Variant SKU
              </span>

              <p className="font-medium">
                {inventory.productVariant.variantSku}
              </p>
            </div>

            <div>
              <span className="text-sm text-slate-500">
                Available Stock
              </span>

              <p className="font-medium">
                {inventory.availableStock}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
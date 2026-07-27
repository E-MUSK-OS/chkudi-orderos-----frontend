"use client";

import {
  Pencil,
  Package,
  Trash2,
} from "lucide-react";

import ActionMenu from "@/components/ui/ActionMenu";

import type { Inventory } from "../types/inventory.types";

interface Props {
  inventory: Inventory;

  onEdit: (inventory: Inventory) => void;

  onAdjust: (inventory: Inventory) => void;

  onDelete: (inventory: Inventory) => void;
}

export default function InventoryActionMenu({
  inventory,
  onEdit,
  onAdjust,
  onDelete,
}: Props) {
  return (
    <ActionMenu
      items={[
        {
          label: "Update Reorder Level",
          icon: Pencil,
          onClick: () => onEdit(inventory),
        },
        {
          label: "Adjust Stock",
          icon: Package,
          onClick: () => onAdjust(inventory),
        },
        {
          label: "Delete Inventory",
          icon: Trash2,
          variant: "danger",
          onClick: () => onDelete(inventory),
        },
      ]}
    />
  );
}
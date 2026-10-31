"use client";

import {
  Pencil,
  Package,
  Trash2,
} from "lucide-react";

import ActionMenu from "@/components/ui/ActionMenu";
import { usePagePermissions } from "@/utils/pagePermissions";

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
  const { canUpdate, canDelete } = usePagePermissions("products/inventory");

  const items: any[] = [];

  if (canUpdate) {
    items.push({
      label: "Update Reorder Level",
      icon: Pencil,
      onClick: () => onEdit(inventory),
    });
    items.push({
      label: "Adjust Stock",
      icon: Package,
      onClick: () => onAdjust(inventory),
    });
  }

  if (canDelete) {
    items.push({
      label: "Delete Inventory",
      icon: Trash2,
      variant: "danger",
      onClick: () => onDelete(inventory),
    });
  }

  if (items.length === 0) return null;

  return <ActionMenu items={items} />;
}

"use client";

import {
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import ActionMenu from "@/components/ui/ActionMenu";
import { usePagePermissions } from "@/utils/pagePermissions";

import type { Product } from "../types/product.types";

interface Props {
  product: Product;

  onEdit: (product: Product) => void;

  onDelete: (product: Product) => void;

  onStatusChange: (product: Product) => void;
}

export default function ProductActionMenu({
  product,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  const { canUpdate, canDelete } = usePagePermissions("settings/manage-product");

  const items: any[] = [];

  if (canUpdate) {
    items.push({
      label: "Edit Product",
      icon: Pencil,
      onClick: () => onEdit(product),
    });
    items.push({
      label: product.isActive ? "Mark as Inactive" : "Mark as Active",
      icon: RefreshCcw,
      onClick: () => onStatusChange(product),
    });
  }

  if (canDelete) {
    items.push({
      label: "Delete Product",
      icon: Trash2,
      variant: "danger",
      onClick: () => onDelete(product),
    });
  }

  if (items.length === 0) return null;

  return <ActionMenu items={items} />;
}

"use client";

import {
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import ActionMenu from "@/components/ui/ActionMenu";

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
  return (
    <ActionMenu
      items={[
        {
          label: "Edit Product",
          icon: Pencil,
          onClick: () => onEdit(product),
        },
        {
          label: product.isActive
            ? "Mark as Inactive"
            : "Mark as Active",
          icon: RefreshCcw,
          onClick: () => onStatusChange(product),
        },
        {
          label: "Delete Product",
          icon: Trash2,
          variant: "danger",
          onClick: () => onDelete(product),
        },
      ]}
    />
  );
}
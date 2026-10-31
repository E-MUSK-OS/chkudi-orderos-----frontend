"use client";

import {
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import ActionMenu from "@/components/ui/ActionMenu";

import type { Material } from "../types/material.types";

interface Props {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onStatusChange: (material: Material) => void;
}

export default function MaterialActionMenu({
  material,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  return (
    <ActionMenu
      items={[
        {
          label: "Edit Material",
          icon: Pencil,
          onClick: () => onEdit(material),
        },
        {
          label: material.isActive
            ? "Mark as Inactive"
            : "Mark as Active",
          icon: RefreshCcw,
          onClick: () => onStatusChange(material),
        },
        {
          label: "Delete Material",
          icon: Trash2,
          variant: "danger",
          onClick: () => onDelete(material),
        },
      ]}
    />
  );
}


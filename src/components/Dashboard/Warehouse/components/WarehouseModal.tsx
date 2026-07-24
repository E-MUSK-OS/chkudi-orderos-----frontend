"use client";

import { Warehouse } from "lucide-react";

import Modal from "@/components/ui/Modal";

import WarehouseForm from "./WarehouseForm";

import type { Warehouse as WarehouseType } from "../types/warehouse.types";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  warehouse?: WarehouseType;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WarehouseModal({
  open,
  mode,
  warehouse,
  onClose,
  onSuccess,
}: Props) {
  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="secondary" fullWidth={false} onClick={onClose}>
        Cancel
      </Button>

      <Button type="submit" form="warehouse-form" fullWidth={false}>
        {mode === "create" ? "Save Warehouse" : "Update Warehouse"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      showHeader={false}
      footer={footer}
    >
      <div className="border-b border-[#E7EAF0] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A0E1A] text-[#E8C16D]">
            <Warehouse size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0A0E1A]">
              {mode === "create" ? "Add Warehouse" : "Edit Warehouse"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "Create a new warehouse for inventory management."
                : "Update warehouse information."}
            </p>
          </div>
        </div>
      </div>

      <WarehouseForm
        mode={mode}
        warehouse={warehouse}
        // onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

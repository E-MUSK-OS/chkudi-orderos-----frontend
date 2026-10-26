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
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
      <Button variant="secondary" fullWidth={false} onClick={onClose} className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 rounded-2xl active:scale-[0.98]">
        Cancel
      </Button>

      <Button type="submit" form="warehouse-form" fullWidth={false} className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 rounded-2xl active:scale-[0.98]">
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
      <div className="-mx-3.5 sm:-mx-6 -mt-3.5 sm:-mt-6 border-b border-[#E7E0D2] px-4 sm:px-6 py-3.5 sm:py-5 bg-[#FAF8F5] dark:bg-[#080B11] dark:border-white/[0.08]">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <Warehouse size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>

          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
              {mode === "create" ? "Add Warehouse" : "Edit Warehouse"}
            </h2>

            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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

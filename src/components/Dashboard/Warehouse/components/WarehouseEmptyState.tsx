"use client";

import { PackageOpen, Plus } from "lucide-react";

import Button from "@/components/ui/Button";

interface Props {
  onAddWarehouse?: () => void;
}

export default function WarehouseEmptyState({
  onAddWarehouse,
}: Props) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7DCE5] bg-white px-6 text-center dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF5DF] text-[#C89B3C] dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
        <PackageOpen size={38} />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-[#0A0E1A] dark:text-white">
        No Warehouses Found
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        You haven&#39;t created any warehouses yet. Create your first warehouse
        to start managing inventory, stock movement and order fulfillment.
      </p>

      <div className="mt-8 w-full sm:w-auto flex justify-center">
        <Button
          fullWidth={false}
          className="w-full max-w-xs sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
          leftIcon={<Plus size={18} />}
          onClick={onAddWarehouse}
        >
          Add Warehouse
        </Button>
      </div>
    </div>
  );
}
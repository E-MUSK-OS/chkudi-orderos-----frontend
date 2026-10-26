"use client";

import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";

interface Props {
  onAddWarehouse: () => void;
}

export default function WarehouseHeader({ onAddWarehouse }: Props) {
  return (
    <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Warehouse Management
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage all your warehouses used for inventory, stock movement and
            order fulfillment from one place.
          </p>
        </div>

        <Button
          fullWidth={false}
          className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98] shrink-0"
          leftIcon={<Plus size={18} />}
          onClick={onAddWarehouse}
        >
          Add Warehouse
        </Button>
      </div>
    </section>
  );
}

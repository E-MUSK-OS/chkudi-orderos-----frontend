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
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7DCE5] bg-white px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF5DF] text-[#C89B3C]">
        <PackageOpen size={38} />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-[#0A0E1A]">
        No Warehouses Found
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        You haven&#39;t created any warehouses yet. Create your first warehouse
        to start managing inventory, stock movement and order fulfillment.
      </p>

      <div className="mt-8">
        <Button
          fullWidth={false}
          leftIcon={<Plus size={18} />}
          onClick={onAddWarehouse}
        >
          Add Warehouse
        </Button>
      </div>
    </div>
  );
}
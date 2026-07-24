"use client";

import Button from "@/components/ui/Button";
import { Plus, Warehouse } from "lucide-react";

interface Props {
  onAddWarehouse: () => void;
}

export default function WarehouseHeader({ onAddWarehouse }: Props) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-[#0A0E1A] text-[#E8C16D]">
            <Warehouse size={24} />
          </div>

          <div>
            <p className="text-xl font-semibold uppercase tracking-wider text-[#E8C16D]">
              Warehouse Management
            </p>

            {/* <h1 className="mt-1 text-2xl font-bold text-[#0A0E1A]">
              Warehouses
            </h1> */}
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-lg leading-6 text-black">
          Manage all your warehouses used for inventory, stock movement and
          order fulfillment from one place.
        </p>
      </div>

      <Button
        fullWidth={false}
        leftIcon={<Plus size={18} />}
        onClick={onAddWarehouse}
      >
        Add Warehouse
      </Button>
    </section>
  );
}

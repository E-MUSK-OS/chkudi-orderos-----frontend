"use client";

import Button from "@/components/ui/Button";
import { Package, Plus } from "lucide-react";

interface Props {
  onAddProduct: () => void;
}

export default function ProductHeader({ onAddProduct }: Props) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-[#0A0E1A] text-[#E8C16D]">
            <Package size={24} />
          </div>

          <div>
            <p className="text-xl font-semibold uppercase tracking-wider text-[#E8C16D]">
              Product Management
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-lg leading-6 text-black">
          Manage all your products, brands and categories from one place for
          inventory, order processing and marketplace integrations.
        </p>
      </div>

      <Button
        fullWidth={false}
        leftIcon={<Plus size={18} />}
        onClick={onAddProduct}
      >
        Add Product
      </Button>
    </section>
  );
}
"use client";

import Button from "@/components/ui/Button";
import { Package, Plus } from "lucide-react";

interface Props {
  onAddProduct: () => void;
  buttonLabel?: string;
}

export default function ProductHeader({ onAddProduct, buttonLabel = "Add Product" }: Props) {
  return (
    <section className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-[#0A0E1A] text-[#E8C16D]">
            <Package size={22} className="sm:hidden" />
            <Package size={24} className="hidden sm:block" />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-semibold uppercase tracking-wider text-[#E8C16D]">
              Product Management
            </h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-700">
          Manage all your products, brands and categories from one place for
          inventory, order processing and marketplace integrations.
        </p>
      </div>

      <div className="w-full sm:w-auto self-stretch sm:self-auto">
        <Button
          fullWidth={true}
          className="sm:w-auto"
          leftIcon={<Plus size={18} />}
          onClick={onAddProduct}
        >
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}
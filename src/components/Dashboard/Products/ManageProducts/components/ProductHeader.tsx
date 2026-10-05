"use client";

import { Plus } from "lucide-react";

interface Props {
  onAddProduct: () => void;
  buttonLabel?: string;
}

export default function ProductHeader({ onAddProduct, buttonLabel = "Add Product" }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Product Management
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage all your products, brands and categories from one place for inventory, order processing and marketplace integrations.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A0E1A] hover:bg-slate-900 px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#E8C16D] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
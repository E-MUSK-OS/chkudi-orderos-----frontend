"use client";

import { Plus, Download } from "lucide-react";

interface Props {
  onAddProduct: () => void;
  buttonLabel?: string;
  onDownloadDemoSheet?: () => void;
  demoSheetLabel?: string;
}

export default function ProductHeader({
  onAddProduct,
  buttonLabel = "Add Product",
  onDownloadDemoSheet,
  demoSheetLabel = "Demo Sheet",
}: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Product Management
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage all your products, brands and categories from one place for inventory, order processing and marketplace integrations.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto self-stretch lg:self-auto shrink-0">
        {onDownloadDemoSheet && (
          <button
            type="button"
            onClick={onDownloadDemoSheet}
            className="inline-flex w-full sm:w-auto min-h-[42px] sm:min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#E8C16D] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs transition-all active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
            title="Download demo Excel sheet"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
            <span>{demoSheetLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex w-full sm:w-auto min-h-[42px] sm:min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#0A0E1A] hover:bg-slate-900 px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#E8C16D] shadow-sm transition-all active:scale-[0.98] cursor-pointer dark:bg-[#F5C451] dark:hover:bg-[#e6b540] dark:text-black"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
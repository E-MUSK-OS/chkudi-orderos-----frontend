"use client";

import { Plus, Download } from "lucide-react";
import { usePagePermissions } from "@/utils/pagePermissions";

interface Props {
  onAddMaterial: () => void;
  buttonLabel?: string;
  onDownloadDemoSheet?: () => void;
  demoSheetLabel?: string;
}

export default function MaterialHeader({
  onAddMaterial,
  buttonLabel = "Add Material",
  onDownloadDemoSheet,
  demoSheetLabel = "Demo Sheet",
}: Props) {
  const { canCreate } = usePagePermissions("settings/manage-material");

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Material Profile
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage all your material profiles, brands and categories from one place for inventory, sourcing and stock specifications.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto self-stretch lg:self-auto shrink-0">
        {onDownloadDemoSheet && (
          <button
            type="button"
            onClick={onDownloadDemoSheet}
            className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-full border border-[#E7E0D2] bg-white hover:bg-slate-50 px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs transition-all active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:hover:bg-white/[0.04]"
            title="Download demo Excel sheet"
          >
            <Download className="h-4 w-4 text-[#B88728] dark:text-[#F5C451]" />
            <span>{demoSheetLabel}</span>
          </button>
        )}

        {canCreate && (
          <button
            type="button"
            onClick={onAddMaterial}
            className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-sm transition-all active:scale-[0.97] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{buttonLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

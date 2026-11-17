"use client";

import React from "react";
import { Check, Loader2, RotateCcw, ShieldCheck } from "lucide-react";

interface Props {
  onSave: () => void;
  onResetDefaults: () => void;
  isSaving: boolean;
}

export default function ClientConfigHeader({
  onSave,
  onResetDefaults,
  isSaving,
}: Props) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Client Configuration
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 whitespace-nowrap shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Central Route Access
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Create & Manage Client wise Productxpert Configuration. Toggle modules and route access dynamically for users and admins.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-row items-center gap-2 sm:gap-2.5 w-full xl:w-auto shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer flex-1 sm:flex-initial w-auto min-h-[38px] sm:h-11 disabled:opacity-60"
            title="Reset to all default permissions"
          >
            <RotateCcw className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span className="whitespace-nowrap">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs active:scale-[0.98] cursor-pointer flex-1 sm:flex-initial w-auto min-h-[38px] sm:h-11 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#0A0E1A]" />
                <span className="whitespace-nowrap">Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-[#0A0E1A] stroke-[3]" />
                <span className="whitespace-nowrap">Save Permissions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

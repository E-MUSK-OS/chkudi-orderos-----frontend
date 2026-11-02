"use client";

import React from "react";
import { Warehouse } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function InventoryDepartmentSwitch({ checked, onChange }: Props) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm mb-4 flex items-center justify-between gap-3 transition-all hover:border-[#E8C16D]/40">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
          <Warehouse className="h-4.5 w-4.5" />
        </div>
        <div>
          <span className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white block">
            Have A Separate Inventory Department?
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Dedicated inventory workflow & rights isolation
          </span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E8C16D] focus:ring-offset-2 ${
          checked ? "bg-[#E8C16D] dark:bg-[#E8C16D]" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#0A0E1A] shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

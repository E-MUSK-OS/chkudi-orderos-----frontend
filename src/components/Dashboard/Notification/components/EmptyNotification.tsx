"use client";

import { BellOff } from "lucide-react";

export default function EmptyNotification() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white py-20 sm:py-24 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
        <BellOff className="h-8 w-8" />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
        No Notifications
      </h2>

      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        You&#39;re all caught up.
      </p>
    </div>
  );
}
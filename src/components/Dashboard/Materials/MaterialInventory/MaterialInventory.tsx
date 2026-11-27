"use client";

import DashboardLayout from "../../layout/DashboardLayout";
import { Boxes } from "lucide-react";

const MaterialInventory = () => {
  return (
    <DashboardLayout title="Material Inventory">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="shrink-0 rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Material Inventory
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track real-time raw material stock levels, allocations, and inventory movements.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-8 sm:p-12 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/70 bg-[#FFF9EC] text-[#B88728] dark:border-[#F5C451]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
            <Boxes className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
            Material Inventory
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Material stock tracking will appear here once material inventory entries are added.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MaterialInventory;

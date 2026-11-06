"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import VMSList from "./Admin/components/VMSList";

export default function ScansVMS() {
  return (
    <DashboardLayout title="Scans VMS">
      <div className="space-y-6">
        {/* Header Card (Matching Amazon Analytics & Order Process UI) */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                VMS Scans
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage all uploaded scan recordings.
              </p>
            </div>
          </div>
        </div>

        <VMSList />
      </div>
    </DashboardLayout>
  );
}
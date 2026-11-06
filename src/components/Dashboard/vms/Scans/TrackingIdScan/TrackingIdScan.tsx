"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import TrackingList from "./components/TrackingList";

export default function TrackingIdScan() {
  return (
    <DashboardLayout title="TrackingId Scan">
      <div className="space-y-6">
        {/* Page Header matching AWB Scan */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              TrackingId Scans
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Verify packed orders by scanning Tracking IDs.
            </p>
          </div>
        </div>

        <TrackingList />
      </div>
    </DashboardLayout>
  );
}
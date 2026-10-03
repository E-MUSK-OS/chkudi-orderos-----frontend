"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import TrackingList from "./components/TrackingList";

export default function TrackingIdScan() {
  return (
    <DashboardLayout title="TrackingId Scan">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
            TrackingId Scans
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Verify packed orders by scanning Tracking IDs.
          </p>
        </div>

        <TrackingList />
      </div>
    </DashboardLayout>
  );
}
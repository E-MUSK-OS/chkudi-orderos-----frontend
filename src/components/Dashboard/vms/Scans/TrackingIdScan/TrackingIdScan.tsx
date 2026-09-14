"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import TrackingList from "./components/TrackingList";

export default function TrackingIdScan() {
  return (
    <DashboardLayout title="TrackingId Scan">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0E1A]">
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
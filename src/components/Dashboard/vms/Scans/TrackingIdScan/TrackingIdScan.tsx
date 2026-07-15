"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import TrackingList from "./components/TrackingList";

export default function TrackingIdScan() {
  return (
    <DashboardLayout title="TrackingId Scan">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl">
            TrackingId Scans
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Verify packed orders by scanning Tracking IDs.
          </p>
        </div>

        <TrackingList />
      </div>
    </DashboardLayout>
  );
}
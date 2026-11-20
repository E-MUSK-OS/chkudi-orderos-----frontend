"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import TrackingList from "./components/TrackingList";

export default function TrackingIdScan() {
  return (
    <DashboardLayout title="TrackingId Scan">
      <TrackingList />
    </DashboardLayout>
  );
}

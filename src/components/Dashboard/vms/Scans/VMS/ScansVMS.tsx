"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import VMSList from "./Admin/components/VMSList";

export default function ScansVMS() {
  return (
    <DashboardLayout title="Scans VMS">
      <div className="space-y-6">

        <div>
          <h1 className="text-4xl">
            VMS Scans
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Manage all uploaded scan recordings.
          </p>
        </div>

        <VMSList />

      </div>
    </DashboardLayout>
  );
}
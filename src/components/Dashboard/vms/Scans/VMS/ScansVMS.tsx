"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import VMSList from "./Admin/components/VMSList";

export default function ScansVMS() {
  return (
    <DashboardLayout title="Scans VMS">
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0E1A]">
            VMS Scans
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage all uploaded scan recordings.
          </p>
        </div>

        <VMSList />

      </div>
    </DashboardLayout>
  );
}
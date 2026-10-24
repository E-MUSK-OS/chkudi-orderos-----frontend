"use client";

import { useEffect } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import StatsCards from "./StatsCards";
import OperatorTable from "./OperatorTable";

import { useOperators } from "../Admin/User/operator/hooks/useOperators";
import { useAccounts } from "../../vms/Admin/Account/hooks/useAccounts";
import { useVMS } from "../../vms/Scans/VMS/Admin/hooks/useVMS";

const Dashboard = () => {
  const { operators, loading, fetchOperators } = useOperators();
  const { accounts, loading: accountLoading, fetchAccounts } = useAccounts();
  const { data: vmsData, loading: vmsLoading } = useVMS();

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              VMS Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Operator performance and average recording time per VMS (Today, Last 7 Days, Total)
            </p>
          </div>
        </div>

        <StatsCards />

        <OperatorTable
          operators={operators}
          loading={loading}
          vmsData={vmsData}
          vmsLoading={vmsLoading}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

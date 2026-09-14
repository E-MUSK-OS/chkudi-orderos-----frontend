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
      <div className="space-y-8">
        <StatsCards />

        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[#0A0E1A]">Recent Operators</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Operator performance and average recording time per VMS (Today, Last 7 Days, Total)
            </p>
          </div>

          <OperatorTable
            operators={operators}
            loading={loading}
            vmsData={vmsData}
            vmsLoading={vmsLoading}
            // onEdit={() => {}}
            // onDelete={() => {}}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

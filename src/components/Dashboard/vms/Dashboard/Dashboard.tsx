"use client";

import { useEffect } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import StatsCards from "./StatsCards";
import OperatorTable from "./OperatorTable";

import { useOperators } from "../Admin/User/operator/hooks/useOperators";

const Dashboard = () => {
  const {
    operators,
    loading,
    fetchOperators,
  } = useOperators();

  useEffect(() => {
    fetchOperators();
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        <StatsCards />

        <div>
          <h2 className="mb-4 text-2xl font-bold">
            Recent Operators
          </h2>

          <OperatorTable
            operators={operators}
            loading={loading}
            // onEdit={() => {}}
            // onDelete={() => {}}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
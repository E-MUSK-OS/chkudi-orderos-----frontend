"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import React from "react";
import StatsCards from "./StatsCards";

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div>
        <div className="mt-8">
          <StatsCards />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

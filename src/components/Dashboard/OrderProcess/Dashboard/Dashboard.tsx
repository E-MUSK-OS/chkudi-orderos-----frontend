"use client";

import { useEffect } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">Order Process</div>
    </DashboardLayout>
  );
};

export default Dashboard;

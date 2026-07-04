"use client";

import DashboardLayout from "../layout/DashboardLayout";
import StatsCards from "./StatsCards";
import RecentOrders from "./RecentOrders";
import Activity from "./Activity";
import { ShoppingBag } from "lucide-react";

export default function DashboardHome() {
  return (
    <DashboardLayout title="Dashboard">
      {/* Top Section */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#C89B3C]">
            Live Overview
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Manage orders, products, customers and revenue from one place.
          </p>
        </div>

        <button
          className="flex h-12 items-center justify-center gap-2 bg-[#0A0E1A] px-6 font-semibold text-white transition hover:bg-[#161D2E]"
        >
          <ShoppingBag size={18} />
          New Order
        </button>
      </div>

      {/* Stats */}

      <div className="mt-8">
        <StatsCards />
      </div>

      {/* Bottom */}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">

        <RecentOrders />

        <Activity />

      </div>
    </DashboardLayout>
  );
}
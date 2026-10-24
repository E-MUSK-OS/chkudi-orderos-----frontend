"use client";

import DashboardLayout from "../layout/DashboardLayout";
import StatsCards from "./StatsCards";
import RecentOrders from "./RecentOrders";
import Activity from "./Activity";
import { ShoppingBag } from "lucide-react";

export default function DashboardHome() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Top Header Card matching UI Theme */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B88728] bg-[#FFF9EC] border border-[#E8C16D]/30 px-2.5 py-0.5 rounded-md">
                  Live Overview
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage orders, products, customers and revenue from one place.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start md:self-center rounded-2xl border border-[#0A0E1A] bg-[#0A0E1A] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#E8C16D] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsCards />

        {/* Bottom */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <RecentOrders />
          <Activity />
        </div>
      </div>
    </DashboardLayout>
  );
}
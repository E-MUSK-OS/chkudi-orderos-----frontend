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
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-sm">
          {/* Top subtle luxury glass rim highlight (dark mode) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent hidden dark:block" />

          {/* Subtle radiant ambient mesh glows (dark mode) */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#F5C451]/10 blur-3xl hidden dark:block" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl hidden dark:block" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B88728] bg-[#FFF9EC] border border-[#E8C16D]/30 px-2.5 py-0.5 rounded-md dark:text-[#F5C451] dark:bg-[#F5C451]/10 dark:border-[#F5C451]/25 dark:rounded-full dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
                  Live Overview
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage orders, products, customers and revenue from one place.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto self-stretch sm:self-start md:self-center min-h-[42px] sm:min-h-[44px] rounded-2xl border border-[#0A0E1A] bg-[#0A0E1A] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#E8C16D] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_20px_rgba(245,196,81,0.25)] dark:hover:shadow-[0_0_30px_rgba(245,196,81,0.45)] dark:hover:brightness-105 active:scale-[0.98] cursor-pointer"
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
"use client";

import React from "react";
import { Store, CheckCircle2, ShoppingCart, RefreshCw, AlertCircle } from "lucide-react";
import type { AmazonSellerAccount } from "../types/amazon.types";

interface AmazonStatsOverviewProps {
  accounts: AmazonSellerAccount[];
  loading?: boolean;
}

export default function AmazonStatsOverview({ accounts, loading }: AmazonStatsOverviewProps) {
  const totalAccounts = accounts.length;
  const connectedAccounts = accounts.filter((a) => a.connectionStatus === "CONNECTED").length;
  const errorAccounts = accounts.filter((a) => a.connectionStatus === "FAILED" || a.connection?.lastError).length;
  const totalOrders = accounts.reduce((acc, a) => acc + (a.stats?.totalOrders || 0), 0);

  // Find latest sync timestamp
  const latestSync = accounts.reduce((latest, a) => {
    const syncTime = a.connection?.lastSyncAt ? new Date(a.connection.lastSyncAt).getTime() : 0;
    return syncTime > latest ? syncTime : latest;
  }, 0);

  const formattedLatestSync = latestSync
    ? new Date(latestSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Connected Sellers */}
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Connected Sellers</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Store size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
            {loading ? "..." : `${connectedAccounts} / ${totalAccounts}`}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
            <CheckCircle2 size={12} className="mr-0.5 inline" /> Active
          </span>
        </div>
      </div>

      {/* 2. Synced Orders */}
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Synced Orders</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <ShoppingCart size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
            {loading ? "..." : totalOrders.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Lifetime</span>
        </div>
      </div>

      {/* 3. Last Sync */}
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Last Sync Cycle</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <RefreshCw size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
            {loading ? "..." : formattedLatestSync}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Automated</span>
        </div>
      </div>

      {/* 4. Attention Required */}
      <div className="rounded-2xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Connection Health</span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${errorAccounts > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>
            {errorAccounts > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
            {loading ? "..." : errorAccounts > 0 ? `${errorAccounts} Issues` : "Healthy"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">SP-API</span>
        </div>
      </div>
    </div>
  );
}

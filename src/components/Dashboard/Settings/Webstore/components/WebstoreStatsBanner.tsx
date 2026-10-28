"use client";

import React from "react";
import { Store, CheckCircle2, XCircle, PackageCheck, Layers } from "lucide-react";
import { Webstore } from "../types/webstore.types";

interface WebstoreStatsBannerProps {
  stores: Webstore[];
}

export default function WebstoreStatsBanner({ stores }: WebstoreStatsBannerProps) {
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.isActive).length;
  const inactiveStores = totalStores - activeStores;
  const totalSkus = stores.reduce((sum, s) => sum + (s.skuCount || 0), 0);

  const uniqueMarketplaces = Array.from(
    new Set(stores.map((s) => s.marketplaceName).filter(Boolean))
  ).length;

  const stats = [
    {
      label: "Total Webstores",
      value: totalStores,
      subtext: "Connected Channels",
      icon: Store,
      color: "text-[#0284C7] dark:text-[#38BDF8]",
      bg: "bg-[#0284C7]/10 dark:bg-[#0284C7]/20",
    },
    {
      label: "Active Stores",
      value: activeStores,
      subtext: `${totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0}% Active Rate`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      label: "Inactive Stores",
      value: inactiveStores,
      subtext: "Paused Integrations",
      icon: XCircle,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
    },
    {
      label: "Sub-SKUs Mapped",
      value: totalSkus.toLocaleString(),
      subtext: "Across All Stores",
      icon: PackageCheck,
      color: "text-[#B88728] dark:text-[#E8C16D]",
      bg: "bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30",
    },
    {
      label: "Channels",
      value: uniqueMarketplaces,
      subtext: "Marketplace Platforms",
      icon: Layers,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {stat.label}
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {stat.value}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {stat.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

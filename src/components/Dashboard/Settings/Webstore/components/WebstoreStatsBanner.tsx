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
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Active Stores",
      value: activeStores,
      subtext: `${totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0}% Active Rate`,
      icon: CheckCircle2,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Inactive Stores",
      value: inactiveStores,
      subtext: "Paused Integrations",
      icon: XCircle,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Sub-SKUs Mapped",
      value: totalSkus.toLocaleString(),
      subtext: "Across All Stores",
      icon: PackageCheck,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Channels",
      value: uniqueMarketplaces,
      subtext: "Marketplace Platforms",
      icon: Layers,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
  ];

  return (
    <section className="grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        const isLastOnMobile = i === 4;

        return (
          <div
            key={i}
            className={`rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/50 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 ${
              isLastOnMobile ? "col-span-2 sm:col-span-1" : "col-span-1"
            }`}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] truncate">
                  {stat.label}
                </p>
                <h3 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-[#0A0E1A] dark:text-white truncate">
                  {stat.value}
                </h3>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {stat.subtext}
                </p>
              </div>
              <div
                className={`grid h-8 w-8 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl border shrink-0 ${stat.iconBg}`}
              >
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

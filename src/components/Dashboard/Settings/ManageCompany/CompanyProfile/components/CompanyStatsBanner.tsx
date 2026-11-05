"use client";

import React from "react";
import { Building2, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Company } from "../types/company.types";

interface CompanyStatsBannerProps {
  companies: Company[];
}

export default function CompanyStatsBanner({
  companies,
}: CompanyStatsBannerProps) {
  const total = companies.length;
  const activeCount = companies.filter((c) => c.status === "ACTIVE").length;
  const draftCount = companies.filter((c) => c.status === "DRAFT").length;

  const uniqueStates = Array.from(
    new Set(companies.map((c) => c.state || c.stateCode).filter(Boolean))
  ).length;

  const stats = [
    {
      label: "Total Companies",
      value: total,
      subtext: "Registered Profiles",
      badge: "Total",
      badgeClass:
        "border-amber-200/60 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
      icon: Building2,
    },
    {
      label: "Active Companies",
      value: activeCount,
      subtext: `${total > 0 ? Math.round((activeCount / total) * 100) : 0}% Active Rate`,
      badge: `${total > 0 ? Math.round((activeCount / total) * 100) : 0}% Active`,
      badgeClass:
        "border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300",
      icon: CheckCircle2,
    },
    {
      label: "Draft Companies",
      value: draftCount,
      subtext: "Incomplete Drafts",
      badge: "Draft",
      badgeClass:
        "border-amber-200/60 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
      icon: Clock,
    },
    {
      label: "States Covered",
      value: uniqueStates || 1,
      subtext: "Jurisdiction Zones",
      badge: "Zones",
      badgeClass:
        "border-blue-200/60 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
      icon: MapPin,
    },
  ];

  return (
    <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-[#E8C16D]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <span
                  className={`rounded-xl border px-2.5 py-0.5 text-xs font-bold ${stat.badgeClass}`}
                >
                  {stat.badge}
                </span>
              </div>

              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
                <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">
                  {stat.value}
                </h3>

                <div className="grid h-11 w-11 place-items-center rounded-2xl border shrink-0 bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {stat.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

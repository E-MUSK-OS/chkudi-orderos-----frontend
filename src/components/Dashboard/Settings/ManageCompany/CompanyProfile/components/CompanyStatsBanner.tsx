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
      icon: Building2,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Active Companies",
      value: activeCount,
      subtext: `${total > 0 ? Math.round((activeCount / total) * 100) : 0}% Active Rate`,
      icon: CheckCircle2,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "Draft Companies",
      value: draftCount,
      subtext: "Incomplete Drafts",
      icon: Clock,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      label: "States Covered",
      value: uniqueStates || 1,
      subtext: "Jurisdiction Zones",
      icon: MapPin,
      iconBg:
        "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/50 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                  {stat.label}
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0A0E1A] dark:text-white">
                  {stat.value}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.subtext}
                </p>
              </div>

              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border shrink-0 ${stat.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

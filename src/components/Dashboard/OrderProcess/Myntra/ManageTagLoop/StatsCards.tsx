"use client";

import { Boxes, CheckCircle2, PackageCheck } from "lucide-react";

import { useMemo } from "react";

import { useTagLoopDashboard } from "./hooks/useTagLoops";

export default function StatsCards() {
  const { data, isLoading } = useTagLoopDashboard();

  const dashboard = data?.data;

  const stats = useMemo(
    () => [
      {
        title: "Total TAG",
        value: dashboard?.totalTags ?? 0,
        icon: Boxes,
      },
      {
        title: "Available",
        value: dashboard?.availableTags ?? 0,
        icon: CheckCircle2,
      },
      {
        title: "Used",
        value: dashboard?.usedTags ?? 0,
        icon: PackageCheck,
      },
    ],
    [dashboard],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 sm:h-36 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm animate-pulse flex items-center justify-between"
          >
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-lg bg-slate-200" />
              <div className="h-8 w-32 rounded-xl bg-slate-200" />
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  const badgeStyles: Record<string, { badge: string; text: string; iconBox: string; iconColor: string }> = {
    "Total TAG": {
      badge: "border-[#E8C16D]/40 bg-[#FFF9EC] text-[#8A6318]",
      text: "Total Pool",
      iconBox: "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40",
      iconColor: "text-[#B88728]",
    },
    Available: {
      badge: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
      text: "Ready to Scan",
      iconBox: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      iconColor: "text-emerald-600",
    },
    Used: {
      badge: "border-amber-200/60 bg-amber-50 text-amber-800",
      text: "Assigned",
      iconBox: "bg-amber-50 text-amber-700 border-amber-200/60",
      iconColor: "text-amber-700",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {stats.map((item) => {
        const Icon = item.icon;
        const style = badgeStyles[item.title] || badgeStyles["Total TAG"];

        return (
          <div
            key={item.title}
            className="group rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                  {item.title}
                </p>
                <span
                  className={`rounded-xl border px-2 py-0.5 text-[11px] font-bold ${style.badge}`}
                >
                  {style.text}
                </span>
              </div>

              <h2 className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A]">
                {item.value.toLocaleString()}
              </h2>
            </div>

            <div
              className={`grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl border shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0 ${style.iconBox}`}
            >
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${style.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-36 animate-pulse bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="group overflow-hidden border border-slate-200 border-l-4 border-l-[#E8C16D] bg-[#0A0E1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>

                <h2 className="mt-3 text-5xl tracking-tight text-white">
                  {item.value.toLocaleString()}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center bg-[#E8C16D] transition-all duration-300 group-hover:scale-110">
                <Icon className="h-7 w-7 text-[#0A0E1A]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

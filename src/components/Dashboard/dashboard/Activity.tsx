"use client";

import { Activity as ActivityIcon, AlertTriangle } from "lucide-react";

const activities = [
  {
    title: "Accepted",
    progress: 82,
  },
  {
    title: "Preparing",
    progress: 56,
  },
  {
    title: "Delivered",
    progress: 74,
  },
];

export default function Activity() {
  return (
    <aside className="space-y-6">
      {/* Activity Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E7E0D2]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0">
              <ActivityIcon className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] tracking-tight">
              Activity
            </h3>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {activities.map((item) => (
            <div key={item.title}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {item.title}
                </span>

                <span className="text-xs sm:text-sm font-mono font-bold text-[#B88728]">
                  {item.progress}%
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E8C16D] to-[#B88728] transition-all duration-500"
                  style={{
                    width: `${item.progress}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0A0E1A] p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 rounded-md border border-[#E8C16D]/30 bg-[#FFF9EC]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#E8C16D]">
          <AlertTriangle className="h-3.5 w-3.5 text-[#E8C16D]" />
          <span>Dashboard</span>
        </div>

        <h3 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
          19 Orders Need Attention
        </h3>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
          Monitor recent activity, pending orders and business performance from your dashboard.
        </p>
      </section>
    </aside>
  );
}
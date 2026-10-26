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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-sm">
        {/* Top subtle luxury glass rim highlight (dark mode) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent hidden dark:block" />

        <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0 dark:h-8 dark:w-8 dark:rounded-xl dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#F5C451] dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
              <ActivityIcon className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] tracking-tight dark:text-white">
              Activity
            </h3>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-5">
          {activities.map((item) => (
            <div key={item.title}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-300">
                  {item.title}
                </span>

                <span className="text-xs sm:text-sm font-mono font-bold text-[#B88728] dark:text-[#F5C451]">
                  {item.progress}%
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden dark:h-2 dark:bg-slate-800/90 dark:border-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E8C16D] to-[#B88728] dark:from-[#F5C451] dark:to-amber-500 dark:shadow-[0_0_12px_rgba(245,196,81,0.35)] transition-all duration-500"
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
      <section className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0A0E1A] p-5 sm:p-6 text-white shadow-sm dark:border-amber-500/25 dark:bg-[#0F1626] dark:text-white dark:shadow-sm">
        {/* Top rim highlight (dark mode) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent hidden dark:block" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl transition-all duration-300 group-hover:bg-amber-500/25 hidden dark:block" />

        <div className="relative z-10 inline-flex items-center gap-1.5 rounded-md border border-[#E8C16D]/30 bg-[#FFF9EC]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#E8C16D] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-[#F5C451] dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
          <AlertTriangle className="h-3.5 w-3.5 text-[#E8C16D] dark:text-[#F5C451]" />
          <span>Dashboard</span>
        </div>

        <h3 className="relative z-10 mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
          19 Orders Need Attention
        </h3>

        <p className="relative z-10 mt-2 text-xs sm:text-sm leading-relaxed text-slate-300 dark:text-slate-400">
          Monitor recent activity, pending orders and business performance from your dashboard.
        </p>
      </section>
    </aside>
  );
}
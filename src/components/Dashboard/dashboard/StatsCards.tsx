"use client";

import { ShoppingBag, TrendingUp, TrendingDown, Clock, Users, IndianRupee } from "lucide-react";

const stats = [
  {
    title: "Today Orders",
    value: "128",
    change: "+12.5%",
    icon: ShoppingBag,
    iconStyle: "bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-amber-500/10 dark:text-[#F5C451] dark:border-amber-500/25 dark:shadow-[0_0_15px_rgba(245,196,81,0.15)]",
    hoverBorder: "hover:border-blue-300 dark:hover:border-[#F5C451]/50",
  },
  {
    title: "Revenue",
    value: "Rs. 84,320",
    change: "+8.2%",
    icon: IndianRupee,
    iconStyle: "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/50",
  },
  {
    title: "Pending",
    value: "19",
    change: "-4.1%",
    icon: Clock,
    iconStyle: "bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25 dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/50",
  },
  {
    title: "Customers",
    value: "2,846",
    change: "+18.4%",
    icon: Users,
    iconStyle: "bg-purple-50 text-purple-600 border-purple-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/25 dark:shadow-[0_0_15px_rgba(99,102,241,0.15)]",
    hoverBorder: "hover:border-purple-300 dark:hover:border-indigo-500/50",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const isPositive = item.change.startsWith("+");

        return (
          <article
            key={item.title}
            className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:-translate-y-0.5 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${item.hoverBorder}`}
          >
            {/* Top subtle luxury glass rim highlight (dark mode) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent hidden dark:block" />

            <div className="relative z-10 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                {item.title}
              </p>
              <div
                className={`grid h-8 w-8 place-items-center rounded-xl border ${item.iconStyle}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="relative z-10 mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white dark:tabular-nums">
                {item.value}
              </h3>

              <span
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${isPositive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {item.change}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
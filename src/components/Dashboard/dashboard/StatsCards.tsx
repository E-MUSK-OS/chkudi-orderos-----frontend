"use client";

import { ShoppingBag, TrendingUp, TrendingDown, Clock, Users, IndianRupee } from "lucide-react";

const stats = [
  {
    title: "Today Orders",
    value: "128",
    change: "+12.5%",
    icon: ShoppingBag,
    iconStyle: "bg-blue-50 text-blue-600 border-blue-200/60",
    hoverBorder: "hover:border-blue-300",
  },
  {
    title: "Revenue",
    value: "Rs. 84,320",
    change: "+8.2%",
    icon: IndianRupee,
    iconStyle: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    title: "Pending",
    value: "19",
    change: "-4.1%",
    icon: Clock,
    iconStyle: "bg-amber-50 text-amber-600 border-amber-200/60",
    hoverBorder: "hover:border-amber-300",
  },
  {
    title: "Customers",
    value: "2,846",
    change: "+18.4%",
    icon: Users,
    iconStyle: "bg-purple-50 text-purple-600 border-purple-200/60",
    hoverBorder: "hover:border-purple-300",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.title}
          className={`rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all ${item.hoverBorder}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {item.title}
            </p>
            <div
              className={`grid h-8 w-8 place-items-center rounded-xl border ${item.iconStyle}`}
            >
              <item.icon className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
              {item.value}
            </h3>

            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                item.change.startsWith("+")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {item.change.startsWith("+") ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {item.change}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
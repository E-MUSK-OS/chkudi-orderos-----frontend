"use client";

import { useEffect, useMemo, useState } from "react";
import { Video, Clock, Users, ShieldCheck } from "lucide-react";

import { useVMS } from "../../vms/Scans/VMS/Admin/hooks/useVMS";
import { useOperators } from "../../vms/Admin/User/operator/hooks/useOperators";
import { useAccounts } from "../../vms/Admin/Account/hooks/useAccounts";

export default function StatsCards() {
  const { data, loading: vmsLoading } = useVMS();
  const { accounts, loading: accountLoading, fetchAccounts } = useAccounts();

  const {
    operators,
    loading: operatorLoading,
    fetchOperators,
  } = useOperators();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchOperators();
    fetchAccounts();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();

    const todayVMS = data.filter((item) => {
      const created = new Date(item.createdAt);

      return (
        created.getFullYear() === today.getFullYear() &&
        created.getMonth() === today.getMonth() &&
        created.getDate() === today.getDate()
      );
    }).length;

    return [
      {
        title: "Total VMS",
        value: data.length,
        icon: Video,
        hoverBorder: "hover:border-blue-300",
        iconStyle: "bg-blue-50 text-blue-600 border-blue-200/60",
        badge: "Total",
        badgeStyle: "border-blue-200 bg-blue-50 text-blue-700",
      },
      {
        title: "Today VMS",
        value: todayVMS,
        icon: Clock,
        hoverBorder: "hover:border-emerald-300",
        iconStyle: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
        badge: "Today",
        badgeStyle: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
      {
        title: "Total Operator",
        value: operators.length,
        icon: Users,
        hoverBorder: "hover:border-amber-300",
        iconStyle: "bg-amber-50 text-amber-600 border-amber-200/60",
        badge: "Operators",
        badgeStyle: "border-amber-200 bg-amber-50 text-amber-800",
      },
      {
        title: "Total Account",
        value: accounts.length,
        icon: ShieldCheck,
        hoverBorder: "hover:border-purple-300",
        iconStyle: "bg-purple-50 text-purple-600 border-purple-200/60",
        badge: "Accounts",
        badgeStyle: "border-purple-200 bg-purple-50 text-purple-700",
      },
    ];
  }, [data, operators, accounts]);

  if (!isMounted || vmsLoading || operatorLoading || accountLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.title}
          className={`rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all ${item.hoverBorder}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-slate-600">{item.title}</p>
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
              className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${item.badgeStyle}`}
            >
              {item.badge}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

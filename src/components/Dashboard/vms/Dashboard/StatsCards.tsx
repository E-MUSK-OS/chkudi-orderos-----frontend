"use client";

import { useEffect, useMemo } from "react";

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

  useEffect(() => {
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
      },
      {
        title: "Today VMS",
        value: todayVMS,
      },
      {
        title: "Total Operator",
        value: operators.length,
      },
      {
        title: "Total Account",
        value: accounts.length,
      },
    ];
  }, [data, operators]);

  if (vmsLoading || operatorLoading || accountLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.title}
          className="border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xl font-medium text-slate-500">{item.title}</p>

          <h3 className="mt-4 text-4xl text-[#0A0E1A]">{item.value}</h3>
        </article>
      ))}
    </div>
  );
}

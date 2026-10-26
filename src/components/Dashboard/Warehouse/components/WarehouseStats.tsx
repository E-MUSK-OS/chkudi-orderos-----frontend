"use client";

import { Warehouse, CheckCircle2, XCircle, Star } from "lucide-react";
import type { WarehouseStats } from "../types/warehouse.types";

interface Props {
  stats?: WarehouseStats;
}

export default function WarehouseStats({ stats }: Props) {
  const cards = [
    {
      title: "Total Warehouses",
      value: stats?.totalWarehouses ?? 0,
      icon: Warehouse,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Active Warehouses",
      value: stats?.activeWarehouses ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Inactive Warehouses",
      value: stats?.inactiveWarehouses ?? 0,
      icon: XCircle,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Default Warehouse",
      value: stats?.defaultWarehouse?.warehouseName ?? "-",
      icon: Star,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
  ];
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/50 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                  {item.title}
                </p>

                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0A0E1A] dark:text-white">
                  {item.value}
                </h3>
              </div>

              <div
                className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30"
              >
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

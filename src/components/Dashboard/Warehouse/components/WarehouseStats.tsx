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
            className="border border-[#E7EAF0] bg-[#0A0E1A] p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-[#E8C16D]">
                  {item.title}
                </p>

                <h3 className="mt-3 text-3xl font-bold text-white">
                  {item.value}
                </h3>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center ${item.iconBg}`}
              >
                <Icon size={24} className={item.iconColor} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

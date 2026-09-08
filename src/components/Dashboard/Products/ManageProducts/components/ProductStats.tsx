"use client";

import {
  Package,
  CheckCircle2,
  XCircle,
  BadgeInfo,
} from "lucide-react";

import type { ProductStats as ProductStatsType } from "../types/product.types";

interface Props {
  stats?: ProductStatsType;
}

export default function ProductStats({ stats }: Props) {
  const cards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Active Products",
      value: stats?.activeProducts ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Inactive Products",
      value: stats?.inactiveProducts ?? 0,
      icon: XCircle,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
    {
      title: "Total Brands",
      value: stats?.totalBrands ?? 0,
      icon: BadgeInfo,
      iconBg: "bg-[#E8C16D]",
      iconColor: "text-[#0A0E1A]",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-lg border border-[#E7EAF0] bg-[#0A0E1A] p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-[#E8C16D]">
                  {item.title}
                </p>

                <h3 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-white">
                  {item.value}
                </h3>
              </div>

              <div
                className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-md ${item.iconBg}`}
              >
                <Icon size={22} className={`${item.iconColor} sm:hidden`} />
                <Icon size={24} className={`${item.iconColor} hidden sm:block`} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
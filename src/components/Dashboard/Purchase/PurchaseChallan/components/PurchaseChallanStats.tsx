"use client";

import React from "react";
import { FileSpreadsheet, PackageCheck, IndianRupee, Clock } from "lucide-react";
import { PurchaseChallan } from "../types/purchaseChallan.types";

interface PurchaseChallanStatsProps {
  challans: PurchaseChallan[];
}

export default function PurchaseChallanStats({ challans }: PurchaseChallanStatsProps) {
  const totalChallans = challans.length;
  const totalQuantity = challans.reduce(
    (sum, c) => sum + (Number(c.totalReceivedQty) || 0),
    0
  );
  const totalAmount = challans.reduce(
    (sum, c) => sum + (Number(c.totalAmount) || 0),
    0
  );
  const pendingCount = challans.filter(
    (c) =>
      c.invoiceStatus === "Pending" ||
      c.invoiceStatus === "Not Invoiced" ||
      !c.invoiceStatus
  ).length;

  const cards = [
    {
      title: "Total Challans",
      value: totalChallans,
      subtext: "All-time inward challan records",
      icon: FileSpreadsheet,
      iconBg: "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      title: "Received Quantity",
      value: totalQuantity.toLocaleString("en-IN"),
      subtext: "Units received into godown",
      icon: PackageCheck,
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
    },
    {
      title: "Total Inward Value",
      value: `₹${totalAmount.toLocaleString("en-IN")}`,
      subtext: "Total inward turnover",
      icon: IndianRupee,
      iconBg: "bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]",
    },
    {
      title: "Pending Invoicing",
      value: pendingCount,
      subtext: "Challans awaiting tax invoice",
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/50 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                  {card.title}
                </p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0A0E1A] dark:text-white">
                  {card.value}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {card.subtext}
                </p>
              </div>

              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border shrink-0 ${card.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

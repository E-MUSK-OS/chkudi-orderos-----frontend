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
    },
    {
      title: "Received Quantity",
      value: totalQuantity.toLocaleString("en-IN"),
      subtext: "Units received into godown",
      icon: PackageCheck,
    },
    {
      title: "Total Inward Value",
      value: `₹${totalAmount.toLocaleString("en-IN")}`,
      subtext: "Total inward turnover",
      icon: IndianRupee,
    },
    {
      title: "Pending Invoicing",
      value: pendingCount,
      subtext: "Challans awaiting tax invoice",
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-between"
          >
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                {card.title}
              </p>
              <h3 className="mt-1.5 text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white leading-none">
                {card.value}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {card.subtext}
              </p>
            </div>

            <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:border-[#E8C16D]/30 dark:text-[#E8C16D]">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </article>
        );
      })}
    </div>
  );
}

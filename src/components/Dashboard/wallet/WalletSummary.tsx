"use client";

import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock3 } from "lucide-react";
import type { WalletSummary as WalletSummaryType } from "./types/wallet.types";

// import { useWallet } from "./hooks/useWallet";

interface Props {
  summary: WalletSummaryType;
  loading: boolean;
}

export default function WalletSummary({ summary, loading }: Props) {
  // const token =
  //   typeof window !== "undefined"
  //     ? localStorage.getItem("accessToken") || ""
  //     : "";

  // const { summary, loading } = useWallet(token);

  const cards = [
    {
      title: "Total Recharge",
      value: summary.totalCredit,
      icon: ArrowDownCircle,
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
      text: "Total wallet recharge",
    },
    {
      title: "Current Balance",
      value: summary.balance,
      icon: Wallet,
      color: "bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border dark:border-[#F5C451]/30",
      text: "Available wallet balance",
    },
    {
      title: "Total Transactions",
      value: summary.totalTransactions,
      icon: ArrowUpCircle,
      color: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30",
      text: "Wallet transactions",
    },
    {
      title: "Total Deduction",
      value: summary.totalDebit,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30",
      text: "Total usage charges",
    },
  ];

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/50 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
                  {card.title}
                </p>

                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#0A0E1A] dark:text-white">
                  {loading ? "..." : card.value.toLocaleString()}
                </h2>

                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{card.text}</p>
              </div>

              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl shrink-0 ${card.color}`}
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

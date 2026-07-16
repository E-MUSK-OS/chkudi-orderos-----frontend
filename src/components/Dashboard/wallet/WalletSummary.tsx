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
      color: "bg-emerald-50 text-emerald-700",
      text: "Total wallet recharge",
    },
    {
      title: "Current Balance",
      value: summary.balance,
      icon: Wallet,
      color: "bg-[#0A0E1A] text-white",
      text: "Available wallet balance",
    },
    {
      title: "Total Transactions",
      value: summary.totalTransactions,
      icon: ArrowUpCircle,
      color: "bg-red-50 text-red-600",
      text: "Wallet transactions",
    },
    {
      title: "Total Deduction",
      value: summary.totalDebit,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
      text: "Total usage charges",
    },
  ];

  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[#0A0E1A]">
                  {loading ? "..." : card.value.toLocaleString()}
                </h2>

                <p className="mt-2 text-xs text-slate-500">{card.text}</p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
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

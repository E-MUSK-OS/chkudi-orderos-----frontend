"use client";

import { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";

import WalletSummary from "./WalletSummary";
import WalletTabs from "./WalletTabs";
import AddBalanceModal from "./AddBalanceModal";
import { useWallet } from "./hooks/useWallet";

export default function Wallet() {
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") || ""
      : "";

  const wallet = useWallet(token);
  return (
    <DashboardLayout title="Wallet">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Wallet Management
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track balance, payments and wallet usage.
              </p>
            </div>

            <button
              onClick={() => setIsAddBalanceOpen(true)}
              className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 bg-[#FEFAEE] px-6 text-sm font-bold text-[#6A4D1D] shadow-2xs transition-all hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_15px_rgba(245,196,81,0.25)] cursor-pointer shrink-0"
            >
              + Add Balance
            </button>
          </div>
        </section>

        <WalletSummary summary={wallet.summary} loading={wallet.loading} />

        <WalletTabs transactions={wallet.transactions} loading={wallet.loading} />
        <AddBalanceModal
          open={isAddBalanceOpen}
          onClose={() => setIsAddBalanceOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}

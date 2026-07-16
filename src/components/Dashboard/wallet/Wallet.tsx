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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#C89B3C]">
            Wallet
          </p>

          <h2 className="mt-2 text-4xl font-bold">Wallet Management</h2>

          <p className="mt-2 text-slate-600">
            Track balance, payments and wallet usage.
          </p>
        </div>

        <button
          onClick={() => setIsAddBalanceOpen(true)}
          className="h-12 bg-[#0A0E1A] px-6 font-semibold text-white transition hover:bg-[#161D2E]"
        >
          + Add Balance
        </button>
      </div>

      <WalletSummary summary={wallet.summary} loading={wallet.loading} />

      <WalletTabs transactions={wallet.transactions} loading={wallet.loading} />
      <AddBalanceModal
        open={isAddBalanceOpen}
        onClose={() => setIsAddBalanceOpen(false)}
      />
    </DashboardLayout>
  );
}

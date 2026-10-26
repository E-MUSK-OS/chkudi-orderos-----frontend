"use client";

import { useState } from "react";

import { CreditCard, History, Wallet } from "lucide-react";

import AccountHistory from "./AccountHistory";
import PaymentHistory from "./PaymentHistory";
import UsedHistory from "./UsedHistory";
import type { WalletTransaction } from "./types/wallet.types";

interface Props {
  transactions: WalletTransaction[];
  loading: boolean;
}

type WalletTab = "account" | "payment" | "used";

const tabs = [
  {
    id: "account" as WalletTab,
    label: "Account History",
    icon: Wallet,
  },
  {
    id: "payment" as WalletTab,
    label: "Payment History",
    icon: CreditCard,
  },
  {
    id: "used" as WalletTab,
    label: "Used History",
    icon: History,
  },
];

export default function WalletTabs({ transactions, loading }: Props) {
  const [activeTab, setActiveTab] = useState<WalletTab>("account");

  return (
    <div className="mt-8">
      {/* Tabs */}

      <div className="flex flex-wrap gap-3 border-b border-[#E7E0D2] dark:border-white/[0.08]">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-xl border-b-2 px-5 py-3.5 text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? "border-[#B88728] text-[#B88728] bg-[#FFF9EC]/50 dark:border-[#F5C451] dark:text-[#F5C451] dark:bg-white/[0.04]"
                  : "border-transparent text-slate-500 hover:text-[#0A0E1A] hover:bg-slate-50/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.02]"
              }`}
            >
              <Icon size={18} />

              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}

      <div>
        {activeTab === "account" && (
          <AccountHistory transactions={transactions} loading={loading} />
        )}

        {activeTab === "payment" && <PaymentHistory />}

        {activeTab === "used" && <UsedHistory />}
      </div>
    </div>
  );
}

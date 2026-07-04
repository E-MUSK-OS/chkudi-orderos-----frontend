"use client";

import { useState } from "react";

import {
  CreditCard,
  History,
  Wallet,
} from "lucide-react";

import AccountHistory from "./AccountHistory";
import PaymentHistory from "./PaymentHistory";
import UsedHistory from "./UsedHistory";

type WalletTab =
  | "account"
  | "payment"
  | "used";

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

export default function WalletTabs() {
  const [activeTab, setActiveTab] =
    useState<WalletTab>("account");

  return (
    <div className="mt-8">

      {/* Tabs */}

      <div className="flex flex-wrap gap-3 border-b border-[#E7E0D2]">

        {tabs.map((tab) => {
          const Icon = tab.icon;

          const active =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition-all

              ${
                active
                  ? "border-[#C89B3C] text-[#C89B3C]"
                  : "border-transparent text-slate-500 hover:text-[#0A0E1A]"
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
          <AccountHistory />
        )}

        {activeTab === "payment" && (
          <PaymentHistory />
        )}

        {activeTab === "used" && (
          <UsedHistory />
        )}

      </div>

    </div>
  );
}
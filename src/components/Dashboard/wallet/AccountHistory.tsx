"use client";

import { Download, Search } from "lucide-react";

import WalletTable from "./WalletTable";
import ReactSelect from "@/components/ui/ReactSelect";

const columns = [
  {
    key: "date",
    label: "Date",
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "type",
    label: "Type",
  },
  {
    key: "amount",
    label: "Amount",
    align: "right" as const,
  },
  {
    key: "balance",
    label: "Balance",
    align: "right" as const,
  },
];

const rows = [
  {
    date: "04 Jul 2026",
    description: "Wallet Topup",
    type: "Credit",
    amount: "₹5,000",
    balance: "₹15,420",
  },
  {
    date: "03 Jul 2026",
    description: "Refund",
    type: "Credit",
    amount: "₹1,200",
    balance: "₹10,420",
  },
  {
    date: "02 Jul 2026",
    description: "Admin Credit",
    type: "Credit",
    amount: "₹500",
    balance: "₹9,220",
  },
  {
    date: "01 Jul 2026",
    description: "Wallet Adjustment",
    type: "Debit",
    amount: "₹350",
    balance: "₹8,720",
  },
];

const options = [
  { label: "All", value: "all" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
];

export default function AccountHistory() {
  return (
    <>
      {/* Filters */}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}

          <div className="flex h-11 flex-1 items-center border border-[#E7E0D2] bg-white px-4 shadow-sm">
            <Search size={18} className="text-slate-400" />

            <input
              type="text"
              placeholder="Search history..."
              className="ml-3 w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* Filter */}

          <ReactSelect options={options} defaultValue={options[0]} />
        </div>

        {/* Export */}

        <button className="flex h-11 items-center gap-2 bg-[#0A0E1A] px-5 text-sm font-semibold text-white transition hover:bg-[#161D2E]">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Table */}

      <WalletTable title="Account History" columns={columns} rows={rows} />
    </>
  );
}

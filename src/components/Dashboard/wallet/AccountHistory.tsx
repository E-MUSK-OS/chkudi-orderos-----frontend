"use client";

import { Download, Search } from "lucide-react";
import type { WalletTransaction } from "./types/wallet.types";

import WalletTable from "./WalletTable";
import ReactSelect from "@/components/ui/ReactSelect";

interface Props {
  transactions: WalletTransaction[];
  loading: boolean;
}

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

const options = [
  { label: "All", value: "all" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
];

export default function AccountHistory({ transactions, loading }: Props) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") || ""
      : "";

  // const { transactions, loading } = useWallet(token);

  const rows = transactions.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

    description: item.description || "-",

    type: item.type === "CREDIT" ? "Credit" : "Debit",

    amount: item.points.toLocaleString(),

    balance: item.balanceAfter.toLocaleString(),
  }));
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

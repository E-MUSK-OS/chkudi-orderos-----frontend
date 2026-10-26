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
    key: "orderId",
    label: "Order ID",
  },
  {
    key: "method",
    label: "Payment Method",
  },
  {
    key: "status",
    label: "Status",
  },
  {
    key: "amount",
    label: "Amount",
    align: "right" as const,
  },
];

const rows = [
  {
    date: "04 Jul 2026",
    orderId: "#ORD-205",
    method: "Wallet",
    status: "Success",
    amount: "₹250",
  },
  {
    date: "03 Jul 2026",
    orderId: "#ORD-201",
    method: "Wallet",
    status: "Pending",
    amount: "₹840",
  },
  {
    date: "02 Jul 2026",
    orderId: "#ORD-199",
    method: "Wallet",
    status: "Failed",
    amount: "₹430",
  },
  {
    date: "01 Jul 2026",
    orderId: "#ORD-194",
    method: "Wallet",
    status: "Success",
    amount: "₹1,250",
  },
];

const options = [
  { label: "All Status", value: "all" },
  { label: "Success", value: "success" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

export default function PaymentHistory() {
  return (
    <>
      {/* Filters */}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}

          <div className="group relative flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-2xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:border-white/[0.08] dark:bg-[#080B11] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/20">
            <Search size={18} className="text-slate-400 transition-colors group-focus-within:text-[#B88728] dark:text-slate-500 dark:group-focus-within:text-[#F5C451] shrink-0" />

            <input
              type="text"
              placeholder="Search payment..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Status */}

          <ReactSelect options={options} defaultValue={options[0]} />
        </div>

        {/* Export */}

        <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0A0E1A] px-5 text-sm font-semibold text-white shadow-2xs transition-all hover:bg-[#161D2E] active:scale-[0.98] dark:border dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] cursor-pointer">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Table */}

      <WalletTable title="Payment History" columns={columns} rows={rows} />
    </>
  );
}

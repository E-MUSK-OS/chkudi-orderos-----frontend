"use client";

import { Download, Search } from "lucide-react";

import WalletTable from "./WalletTable";

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

export default function PaymentHistory() {
  return (
    <>
      {/* Filters */}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-1 items-center gap-3">

          {/* Search */}

          <div className="flex h-11 flex-1 items-center rounded-lg border border-[#E7E0D2] bg-white px-4 shadow-sm">

            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              type="text"
              placeholder="Search payment..."
              className="ml-3 w-full bg-transparent text-sm outline-none"
            />

          </div>

          {/* Status */}

          <select className="h-11 rounded-lg border border-[#E7E0D2] bg-white px-4 text-sm shadow-sm">

            <option>All Status</option>

            <option>Success</option>

            <option>Pending</option>

            <option>Failed</option>

          </select>

        </div>

        {/* Export */}

        <button className="flex h-11 items-center gap-2 rounded-lg bg-[#0A0E1A] px-5 text-sm font-semibold text-white hover:bg-[#161D2E]">

          <Download size={18} />

          Export

        </button>

      </div>

      {/* Table */}

      <WalletTable
        title="Payment History"
        columns={columns}
        rows={rows}
      />
    </>
  );
}
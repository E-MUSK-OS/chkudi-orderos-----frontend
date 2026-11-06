"use client";

import { Download, Search } from "lucide-react";

import WalletTable from "./WalletTable";
import ReactSelect from "@/components/ui/ReactSelect";
import { exportToExcel } from "@/lib/exportToExcel";

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
    key: "service",
    label: "Service",
  },
  {
    key: "description",
    label: "Description",
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
    service: "Shipping",
    description: "Shipping Label Charge",
    amount: "₹40",
  },
  {
    date: "03 Jul 2026",
    orderId: "#ORD-202",
    service: "COD",
    description: "COD Handling Fee",
    amount: "₹25",
  },
  {
    date: "02 Jul 2026",
    orderId: "#ORD-199",
    service: "Weight",
    description: "Additional Weight Charge",
    amount: "₹60",
  },
  {
    date: "01 Jul 2026",
    orderId: "#ORD-194",
    service: "Packaging",
    description: "Packaging Material",
    amount: "₹35",
  },
  {
    date: "30 Jun 2026",
    orderId: "#ORD-188",
    service: "Insurance",
    description: "Shipment Insurance",
    amount: "₹18",
  },
];

const options = [
  { label: "All Services", value: "all" },
  { label: "Shipping", value: "shipping" },
  { label: "COD", value: "cod" },
  { label: "Packaging", value: "packaging" },
  { label: "Insurance", value: "insurance" },
  { label: "Weight", value: "weight" },
];

const handleExport = () => {
  exportToExcel(
    rows.map((item) => ({
      Date: item.date,
      "Order ID": item.orderId,
      Service: item.service,
      Description: item.description,
      Amount: item.amount,
    })),
    "used-history",
    "Used History",
  );
};

export default function UsedHistory() {
  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="group relative flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-2xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:border-white/[0.08] dark:bg-[#080B11] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/20">
            <Search size={18} className="text-slate-400 transition-colors group-focus-within:text-[#B88728] dark:text-slate-500 dark:group-focus-within:text-[#F5C451] shrink-0" />

            <input
              type="text"
              placeholder="Search used history..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
          <ReactSelect options={options} defaultValue={options[0]} />
        </div>

        <button
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 bg-[#FEFAEE] px-5 text-sm font-bold text-[#6A4D1D] shadow-2xs transition-all hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] dark:border dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] cursor-pointer"
          onClick={handleExport}
        >
          <Download size={18} />
          Export
        </button>
      </div>

      <WalletTable title="Used History" columns={columns} rows={rows} />
    </>
  );
}

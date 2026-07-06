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
          <div className="flex h-11 flex-1 items-center  border border-[#E7E0D2] bg-white px-4 shadow-sm">
            <Search size={18} className="text-slate-400" />

            <input
              type="text"
              placeholder="Search used history..."
              className="ml-3 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ReactSelect options={options} defaultValue={options[0]} />
        </div>

        <button
          className="flex h-11 items-center gap-2 bg-[#0A0E1A] px-5 text-sm font-semibold text-white transition hover:bg-[#161D2E]"
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

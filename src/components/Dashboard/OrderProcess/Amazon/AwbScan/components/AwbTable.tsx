"use client";

import { CheckCircle2, Clock, PackageCheck, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";

interface Props {
  orders: AmazonOrderItem[];
  isLoading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function AwbTable({
  orders,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  // Helper to render ASINs or SKUs with neat chips if multi-line
  const renderChips = (value: string, color: "gold" | "slate") => {
    if (!value || value === "N/A" || value === "-") {
      return <span className="text-slate-500 italic">N/A</span>;
    }

    const items = value
      .split(/[\r\n]+|\s+\/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length <= 1) {
      return (
        <span
          className={`font-mono text-xs font-bold ${
            color === "gold" ? "text-[#E8C16D]" : "text-slate-300"
          }`}
        >
          {items[0] || value}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        {items.map((it, idx) => (
          <span
            key={idx}
            className={`px-1.5 py-0.5 font-mono text-[11px] font-bold ${
              color === "gold"
                ? "bg-[#E8C16D]/15 text-[#E8C16D] border border-[#E8C16D]/30"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            {it}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="border border-slate-700 bg-[#0F172A]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead className="bg-[#0A0E1A] text-xs font-bold tracking-wider text-[#E8C16D] uppercase">
            <tr className="border-b border-slate-700/80">
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Invoices</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Amazon Order ID</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">AWB Tracking</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">ASIN</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Seller SKU</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Customer</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Packing Scan Status</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
            {isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span>Loading Amazon orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageCheck className="h-8 w-8 text-slate-600" />
                    <p className="font-semibold text-slate-300">No Amazon orders found.</p>
                    <p className="text-xs text-slate-500">
                      Orders are automatically added here when printed in Amazon Order Process.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((item) => {
                const isScanned = item.packingScanStatus === "SCANNED";
                let formattedTime = "-";
                try {
                  formattedTime = format(new Date(item.createdAt), "dd MMM, hh:mm a");
                } catch (e) {}

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      isScanned ? "bg-emerald-950/10" : ""
                    }`}
                  >
                    {/* Invoice */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-300 whitespace-nowrap">
                      {item.invoice || "N/A"}
                    </td>

                    {/* Amazon Order ID */}
                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-white whitespace-nowrap">
                      {item.orderId}
                    </td>

                    {/* AWB Tracking */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-xs font-bold text-white tracking-wider">
                        {item.awb}
                      </span>
                    </td>

                    {/* ASIN */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {renderChips(item.asin, "slate")}
                    </td>

                    {/* Seller SKU */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {renderChips(item.sellerSku, "gold")}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 text-center font-medium text-slate-200 whitespace-nowrap">
                      {item.customer || "N/A"}
                    </td>

                    {/* Packing Scan Status */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {isScanned ? (
                        <span className="inline-flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>SCANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
                          <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3.5 text-center text-xs text-slate-400 whitespace-nowrap">
                      {formattedTime}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700/80 bg-[#0A0E1A] px-5 py-3.5">
        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{startIndex + 1}</strong> -{" "}
          <strong className="text-white">{endIndex}</strong> of{" "}
          <strong className="text-white">{total}</strong> orders
        </div>

        <div className="flex items-center gap-3">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-slate-700 bg-[#111827] px-2 py-1 text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="border border-slate-700 bg-[#111827] px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Prev
            </button>
            <span className="bg-slate-800 px-3 py-1 text-xs font-bold text-white">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="border border-slate-700 bg-[#111827] px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

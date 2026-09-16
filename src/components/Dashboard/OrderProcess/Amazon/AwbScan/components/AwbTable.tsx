"use client";

import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { formatToIST } from "../timeUtils";
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

  // Helper to render ASINs or SKUs with neat styling if multi-line
  const renderChips = (value: string, isAsin = false) => {
    if (!value || value === "N/A" || value === "-") {
      return <span className="text-slate-400 italic text-sm">N/A</span>;
    }

    const items = value
      .split(/[\r\n]+|\s+\/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length <= 1) {
      return (
        <span
          className={`text-sm sm:text-base font-semibold ${isAsin ? "font-mono text-[#0A0E1A]" : "text-slate-800"
            }`}
        >
          {items[0] || value}
        </span>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-1 py-1">
        {items.map((it, idx) => (
          <span
            key={idx}
            className={`rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs sm:text-sm font-semibold text-slate-900 ${isAsin ? "font-mono" : ""
              }`}
          >
            {it}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Invoices</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Amazon Order ID</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">AWB Tracking</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">ASIN</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Seller SKU</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Packing Scan Status</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-sm sm:text-base">
            {isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-base font-semibold text-slate-600">Loading Amazon orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageCheck className="h-10 w-10 text-slate-400" />
                    <p className="text-base font-bold text-slate-700">No Amazon orders found.</p>
                    <p className="text-sm text-slate-400">
                      Orders are automatically added here when printed in Amazon Order Process.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((item) => {
                const isScanned = item.packingScanStatus === "SCANNED";
                const formattedTime = formatToIST(item.updatedAt || item.createdAt);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 ${isScanned ? "bg-emerald-50/25" : ""
                      }`}
                  >
                    {/* Invoice */}
                    <td className="px-4 py-4 text-center font-semibold text-slate-700 whitespace-nowrap text-sm sm:text-base">
                      {item.invoice || "N/A"}
                    </td>

                    {/* Amazon Order ID */}
                    <td className="px-4 py-4 text-center font-mono font-bold text-[#0A0E1A] whitespace-nowrap text-sm sm:text-base">
                      {item.orderId}
                    </td>

                    {/* AWB Tracking */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 tracking-wider text-sm sm:text-base">
                        {item.awb}
                      </span>
                    </td>

                    {/* ASIN */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {renderChips(item.asin, true)}
                    </td>

                    {/* Seller SKU */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {renderChips(item.sellerSku, false)}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4 text-center font-semibold text-slate-800 whitespace-nowrap text-sm sm:text-base">
                      {item.customer || "N/A"}
                    </td>

                    {/* Packing Scan Status */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {isScanned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-100 px-3 py-1.5 text-xs sm:text-sm font-bold text-green-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>SCANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-800">
                          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-4 text-center font-mono text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E7E0D2] bg-white px-5 py-3.5">
        <div className="text-xs text-slate-500">
          Showing <strong className="text-[#0A0E1A]">{startIndex + 1}</strong> -{" "}
          <strong className="text-[#0A0E1A]">{endIndex}</strong> of{" "}
          <strong className="text-[#0A0E1A]">{total}</strong> orders
        </div>

        <div className="flex items-center gap-3">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-[#E7E0D2] bg-white px-2 py-1 text-xs font-bold text-[#0A0E1A] outline-none cursor-pointer"
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
              className="border border-[#0A0E1A] bg-[#0A0E1A] px-3 py-1 text-xs font-bold text-[#E8C16D] transition hover:bg-[#161D2E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Prev
            </button>
            <span className="border border-[#E7E0D2] bg-[#FFF9EC] px-3 py-1 text-xs font-bold text-[#0A0E1A]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="border border-[#0A0E1A] bg-[#0A0E1A] px-3 py-1 text-xs font-bold text-[#E8C16D] transition hover:bg-[#161D2E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

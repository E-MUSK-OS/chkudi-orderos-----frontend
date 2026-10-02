"use client";

import {
  CheckCircle2,
  Clock,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatToIST } from "../timeUtils";
import { AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";
import Pagination from "@/components/ui/Pagination";

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

    const rawItems = value
      .split(/[\r\n]+|\s+\/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const items = Array.from(new Set(rawItems));

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
            className={`rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs sm:text-sm font-semibold text-slate-900 ${isAsin ? "font-mono" : ""
              }`}
          >
            {it}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white shadow-sm overflow-hidden">
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
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs sm:text-sm font-bold text-green-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>SCANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs sm:text-sm font-bold text-amber-800">
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
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        itemName="orders"
        isLoading={isLoading}
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={onPageChange}
        onLimitChange={(newLimit) => {
          onLimitChange(newLimit);
          onPageChange(1);
        }}
      />
    </div>
  );
}

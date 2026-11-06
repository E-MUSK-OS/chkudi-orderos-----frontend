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
          className={`text-sm sm:text-base font-semibold ${isAsin ? "font-mono text-[#0A0E1A] dark:text-white" : "text-slate-800 dark:text-slate-200"
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
            className={`rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#131926] px-2 py-0.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white ${isAsin ? "font-mono" : ""
              }`}
          >
            {it}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[1000px] lg:min-w-[1100px] border-collapse text-left font-sans">
          <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
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

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm">
            {isLoading && orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-sm font-bold text-[#0A0E1A] dark:text-white">Loading Amazon orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
                      <PackageCheck className="h-8 w-8 text-[#B88728] dark:text-[#F5C451]" />
                    </div>
                    <p className="text-base font-bold text-[#0A0E1A] dark:text-white">No Amazon orders found</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
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
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06] ${
                      isScanned ? "bg-emerald-50/20 dark:bg-emerald-500/5" : ""
                    }`}
                  >
                    {/* Invoice */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs sm:text-sm">
                      {item.invoice || "N/A"}
                    </td>

                    {/* Amazon Order ID */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap text-xs sm:text-sm">
                      {item.orderId}
                    </td>

                    {/* AWB Tracking */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider text-xs sm:text-sm">
                        {item.awb}
                      </span>
                    </td>

                    {/* ASIN */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {renderChips(item.asin, true)}
                    </td>

                    {/* Seller SKU */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {renderChips(item.sellerSku, false)}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800 dark:text-slate-300 whitespace-nowrap text-xs sm:text-sm">
                      {item.customer || "N/A"}
                    </td>

                    {/* Packing Scan Status */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {isScanned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>SCANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
        variant="dark"
        isLoading={isLoading}
        className="border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={onPageChange}
        onLimitChange={(newLimit) => {
          onLimitChange(newLimit);
          onPageChange(1);
        }}
      />
    </div>
  );
}

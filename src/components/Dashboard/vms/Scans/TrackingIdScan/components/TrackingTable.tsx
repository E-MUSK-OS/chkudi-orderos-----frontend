"use client";

import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import type { VMSItem } from "../../VMS/Admin/types";
import Pagination from "@/components/ui/Pagination";

interface Props {
  data: VMSItem[];
  isLoading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TrackingTable({
  data,
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

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[950px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] dark:bg-[#080B11] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <tr>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Tracking ID</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Date</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Time</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Operator</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Account</th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Scan Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm">
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-sm font-bold text-[#0A0E1A] dark:text-white">Loading Tracking records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30">
                      <PackageCheck className="h-8 w-8 text-[#B88728] dark:text-[#E8C16D]" />
                    </div>
                    <p className="text-base font-bold text-[#0A0E1A] dark:text-white">No Tracking records found</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      Scanned records will appear here in real-time.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isScanned = item.packingScanStatus === "SCANNED";
                let formattedDate = "-";
                let formattedTime = "-";
                try {
                  const d = new Date(item.createdAt);
                  formattedDate = format(d, "dd MMM yyyy");
                  formattedTime = format(d, "hh:mm:ss aa");
                } catch (e) { }

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06] ${
                      isScanned ? "bg-emerald-50/20 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    {/* Tracking ID */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap tracking-wider text-xs sm:text-sm">
                      {item.trackingId}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs sm:text-sm">
                      {formattedDate}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formattedTime}
                    </td>

                    {/* Operator */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs sm:text-sm">
                      {item.operator?.operatorName ?? "-"}
                    </td>

                    {/* Account */}
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-xs sm:text-sm">
                      {item.account?.accountName ?? "-"}
                    </td>

                    {/* Scan Status */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {isScanned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>SCANNED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span>PENDING</span>
                        </span>
                      )}
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
        itemName="records"
        isLoading={isLoading}
        variant="dark"
        className="border-t border-slate-800 dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={onPageChange}
        onLimitChange={(newLimit) => {
          onLimitChange(newLimit);
          onPageChange(1);
        }}
      />
    </div>
  );
}

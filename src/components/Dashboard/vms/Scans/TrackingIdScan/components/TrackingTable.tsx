"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import type { VMSItem } from "../../VMS/Admin/types";
import Pagination from "@/components/ui/Pagination";
import CopyButton from "@/components/ui/CopyButton";

interface Props {
  data: VMSItem[];
  isLoading?: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function TrackingTable({
  data,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  tableContainerRef,
}: Props) {
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = tableContainerRef || internalRef;

  useEffect(() => {
    resolvedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, limit, resolvedRef]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div
        ref={resolvedRef}
        className="w-full overflow-x-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[950px] lg:min-w-[1050px] border-collapse text-left font-sans relative">
          <thead className="lg:sticky lg:top-0 z-10 bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] shadow-xs">
            <tr>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">NO.</th>
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
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      Loading Tracking records...
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
                      <PackageCheck className="h-8 w-8 text-[#B88728] dark:text-[#F5C451]" />
                    </div>
                    <p className="text-base font-bold text-[#0A0E1A] dark:text-white">
                      No Tracking records found
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      Scanned records will appear here in real-time.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isScanned = item.packingScanStatus === "SCANNED";
                let formattedDate = "-";
                let formattedTime = "-";
                try {
                  const d = new Date(item.createdAt);
                  formattedDate = format(d, "dd MMM yyyy");
                  formattedTime = format(d, "hh:mm:ss aa");
                } catch (e) {}
                const rowNumber = (page - 1) * limit + index + 1;

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                  >
                    {/* NO. */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs sm:text-sm">
                      {rowNumber}
                    </td>

                    {/* Tracking ID */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider text-xs sm:text-sm">
                          {item.trackingId}
                        </span>
                        <CopyButton text={item.trackingId} />
                      </div>
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
        variant="dark"
        isLoading={isLoading}
        className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5 mt-auto"
        onPageChange={onPageChange}
        onLimitChange={(newLimit) => {
          onLimitChange(newLimit);
          onPageChange(1);
        }}
      />
    </div>
  );
}

"use client";

import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import type { VMSItem } from "../../VMS/Admin/types";

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
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead className="bg-[#0A0E1A] text-sm sm:text-base font-bold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-5 py-4 text-center whitespace-nowrap">Tracking ID</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Date</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Time</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Operator</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Account</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Scan Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-sm sm:text-base">
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-base font-semibold text-slate-600">Loading Tracking records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <PackageCheck className="h-10 w-10 text-slate-400" />
                    <p className="text-base font-bold text-slate-700">No Tracking records found.</p>
                    <p className="text-sm text-slate-400">
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
                } catch (e) {}

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isScanned ? "bg-emerald-50/25" : ""
                    }`}
                  >
                    {/* Tracking ID */}
                    <td className="px-5 py-4 text-center font-mono text-sm sm:text-base font-bold text-[#0A0E1A] whitespace-nowrap tracking-wide">
                      {item.trackingId}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-center text-sm sm:text-base font-semibold text-slate-800 whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 text-center font-mono text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap">
                      {formattedTime}
                    </td>

                    {/* Operator */}
                    <td className="px-5 py-4 text-center text-sm sm:text-base font-semibold text-slate-800 whitespace-nowrap">
                      {item.operator?.operatorName ?? "-"}
                    </td>

                    {/* Account */}
                    <td className="px-5 py-4 text-center text-sm sm:text-base font-semibold text-slate-800 whitespace-nowrap">
                      {item.account?.accountName ?? "-"}
                    </td>

                    {/* Scan Status */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {isScanned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-100 px-3 py-1.5 text-xs sm:text-sm font-bold text-green-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Scanned</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-100 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-800">
                          <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                          <span>Pending</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E7E0D2] bg-white px-5 py-4">
        <div className="text-xs sm:text-sm text-slate-600">
          Showing <strong className="font-bold text-[#0A0E1A]">{startIndex + 1}</strong> -{" "}
          <strong className="font-bold text-[#0A0E1A]">{endIndex}</strong> of{" "}
          <strong className="font-bold text-[#0A0E1A]">{total}</strong> records
        </div>

        <div className="flex items-center gap-3">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="border border-[#E7E0D2] bg-white px-2.5 py-1 text-xs sm:text-sm font-bold text-[#0A0E1A] outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
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
              className="border border-[#0A0E1A] bg-[#0A0E1A] px-3.5 py-1 text-xs sm:text-sm font-bold text-[#E8C16D] transition hover:bg-[#161D2E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Prev
            </button>
            <span className="border border-[#E7E0D2] bg-[#FFF9EC] px-3.5 py-1 text-xs sm:text-sm font-bold text-[#0A0E1A]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="border border-[#0A0E1A] bg-[#0A0E1A] px-3.5 py-1 text-xs sm:text-sm font-bold text-[#E8C16D] transition hover:bg-[#161D2E] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState, useEffect } from "react";
import { Users } from "lucide-react";

import { Operator } from "../Admin/User/operator/types/operator";
import { useVMS } from "../../vms/Scans/VMS/Admin/hooks/useVMS";
import type { VMSItem } from "../../vms/Scans/VMS/Admin/types";
import Pagination from "@/components/ui/Pagination";

interface Props {
  operators: Operator[];
  loading?: boolean;
  vmsData?: VMSItem[];
  vmsLoading?: boolean;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) {
    return "-";
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

const OperatorTable: React.FC<Props> = ({
  operators,
  loading = false,
  vmsData,
  vmsLoading = false,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = operators.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit;

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedOperators = useMemo(() => {
    return operators.slice(startIndex, startIndex + limit);
  }, [operators, startIndex, limit]);

  // If vmsData is not supplied via props, fall back to internal hook query
  const vmsHook = useVMS();
  const effectiveVmsData = vmsData ?? vmsHook.data;
  const isVmsLoading = vmsLoading || (vmsData === undefined && vmsHook.loading);

  const timingStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        todaySum: number;
        todayCount: number;
        weekSum: number;
        weekCount: number;
        totalSum: number;
        totalCount: number;
      }
    >();

    if (!effectiveVmsData || effectiveVmsData.length === 0) return map;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000;
    // Last 7 days includes today and preceding 6 days
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();

    for (const item of effectiveVmsData) {
      const duration = item.duration;
      if (typeof duration !== "number" || duration <= 0) continue;

      const primaryKey = item.operatorId || item.operator?.id || item.operator?.employeeCode;
      if (!primaryKey) continue;

      let stats = map.get(primaryKey);
      if (!stats) {
        stats = {
          todaySum: 0,
          todayCount: 0,
          weekSum: 0,
          weekCount: 0,
          totalSum: 0,
          totalCount: 0,
        };
        map.set(primaryKey, stats);
      }

      const createdTime = new Date(item.createdAt).getTime();

      // Total
      stats.totalSum += duration;
      stats.totalCount += 1;

      // Today
      if (createdTime >= startOfToday && createdTime < endOfToday) {
        stats.todaySum += duration;
        stats.todayCount += 1;
      }

      // Last 7 days
      if (createdTime >= startOfWeek && createdTime < endOfToday) {
        stats.weekSum += duration;
        stats.weekCount += 1;
      }

      // Map secondary keys to same reference
      if (item.operatorId && !map.has(item.operatorId)) {
        map.set(item.operatorId, stats);
      }
      if (item.operator?.id && !map.has(item.operator.id)) {
        map.set(item.operator.id, stats);
      }
      if (item.operator?.employeeCode && !map.has(item.operator.employeeCode)) {
        map.set(item.operator.employeeCode, stats);
      }
    }

    return map;
  }, [effectiveVmsData]);

  const getOperatorStats = (operator: Operator) => {
    const stats =
      timingStatsMap.get(operator.id) ||
      (operator.employeeCode ? timingStatsMap.get(operator.employeeCode) : undefined);

    return {
      todayAvg: stats && stats.todayCount > 0 ? stats.todaySum / stats.todayCount : null,
      todayCount: stats ? stats.todayCount : 0,
      weekAvg: stats && stats.weekCount > 0 ? stats.weekSum / stats.weekCount : null,
      weekCount: stats ? stats.weekCount : 0,
      totalAvg: stats && stats.totalCount > 0 ? stats.totalSum / stats.totalCount : null,
      totalCount: stats ? stats.totalCount : 0,
    };
  };

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent mx-auto mb-2" />
        <p className="text-sm font-bold text-[#0A0E1A]">Loading operators...</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF9EC] border border-[#E8C16D]/30">
          <Users className="h-7 w-7 text-[#B88728]" />
        </div>
        <p className="text-base font-bold text-[#0A0E1A]">No Operators Found</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E7E0D2] px-5 py-4 bg-white gap-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] tracking-tight">
                Recent Operators
              </h3>
              <p className="text-xs text-slate-500">
                Operator performance and average recording time per VMS (Today, Last 7 Days, Total)
              </p>
            </div>
          </div>

          <span className="rounded-lg border border-[#E8C16D]/40 bg-[#FFF9EC] px-2.5 py-0.5 text-xs font-bold text-[#B88728] self-start sm:self-center">
            {operators.length} Operators
          </span>
        </div>

        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[950px] border-collapse text-left font-sans">
            <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-14">
                NO.
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Operator Name
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Operator Code
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Today Avg Time
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Last 7 Days Avg
              </th>
              <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Total Avg Time
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm">
            {paginatedOperators.map((operator, index) => {
              const stats = getOperatorStats(operator);

              return (
                <tr
                  key={operator.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {/* NO. */}
                  <td className="px-4 py-3.5 text-center font-bold text-slate-500 whitespace-nowrap text-xs sm:text-sm">
                    {startIndex + index + 1}
                  </td>

                  {/* Operator Name */}
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                    {operator.operatorName}
                  </td>

                  {/* Operator Code */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-bold text-slate-800 bg-slate-100 rounded-lg border border-slate-200">
                      {operator.employeeCode}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {operator.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Today Avg Time */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.todayCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                          {formatDuration(stats.todayAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                          {stats.todayCount} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-sm">-</span>
                    )}
                  </td>

                  {/* Last 7 Days Avg */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.weekCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                          {formatDuration(stats.weekAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-200">
                          {stats.weekCount.toLocaleString()} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-sm">-</span>
                    )}
                  </td>

                  {/* Total Avg Time */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.totalCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                          {formatDuration(stats.totalAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1 border border-blue-200">
                          {stats.totalCount.toLocaleString()} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-sm">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pagination Bar */}
    <Pagination
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      options={[5, 10, 20, 50]}
      itemName="operators"
      isLoading={loading}
      variant="dark"
      className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
      onPageChange={setPage}
      onLimitChange={(newLimit) => {
        setLimit(newLimit);
        setPage(1);
      }}
    />
  </section>
);
};

export default OperatorTable;

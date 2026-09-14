import React, { useMemo } from "react";

import { Operator } from "../Admin/User/operator/types/operator";
import { useVMS } from "../../vms/Scans/VMS/Admin/hooks/useVMS";
import type { VMSItem } from "../../vms/Scans/VMS/Admin/types";

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
      <div className="bg-white border border-[#E7E0D2] rounded-xl p-12 text-center shadow-sm">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0A0E1A] border-r-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium text-slate-600">Loading operators...</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="bg-white border border-[#E7E0D2] rounded-xl p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-semibold">No Operators Found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E0D2] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E7E0D2]">
          <thead className="bg-[#0A0E1A] text-[#E8C16D]">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                NO.
              </th>
              <th className="px-4 py-3.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                Operator Name
              </th>
              <th className="px-4 py-3.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                Operator Code
              </th>
              <th className="px-4 py-3.5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3.5 text-center text-xs sm:text-sm font-bold uppercase tracking-wider">
                Today Avg Time
              </th>
              <th className="px-4 py-3.5 text-center text-xs sm:text-sm font-bold uppercase tracking-wider">
                Last 7 Days Avg
              </th>
              <th className="px-4 py-3.5 text-center text-xs sm:text-sm font-bold uppercase tracking-wider">
                Total Avg Time
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-[#E7E0D2]">
            {operators.map((operator, index) => {
              const stats = getOperatorStats(operator);

              return (
                <tr
                  key={operator.id}
                  className="hover:bg-[#FDFBF7] transition-colors"
                >
                  {/* NO. */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                    {index + 1}
                  </td>

                  {/* Operator Name */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {operator.operatorName}
                    </span>
                  </td>

                  {/* Operator Code */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 text-xs sm:text-sm font-mono font-semibold text-slate-700 bg-slate-100 rounded-md border border-slate-200">
                      {operator.employeeCode}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {operator.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Today Avg Time */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.todayCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          {formatDuration(stats.todayAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                          {stats.todayCount} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-base">-</span>
                    )}
                  </td>

                  {/* Last 7 Days Avg */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.weekCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          {formatDuration(stats.weekAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-200">
                          {stats.weekCount.toLocaleString()} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-base">-</span>
                    )}
                  </td>

                  {/* Total Avg Time */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {isVmsLoading ? (
                      <span className="text-xs text-slate-400 animate-pulse">Calculating...</span>
                    ) : stats.totalCount > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          {formatDuration(stats.totalAvg)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1 border border-blue-200">
                          {stats.totalCount.toLocaleString()} VMS
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold text-base">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperatorTable;

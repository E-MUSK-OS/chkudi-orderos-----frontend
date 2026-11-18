"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, Eye } from "lucide-react";
import type { AmazonSyncLog } from "../types/amazon.types";

interface SyncHistoryTableProps {
  logs: AmazonSyncLog[];
  loading?: boolean;
  onViewError: (log: AmazonSyncLog) => void;
}

export default function SyncHistoryTable({ logs, loading, onViewError }: SyncHistoryTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading synchronization logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        No synchronization logs found. Trigger a manual sync or wait for the automated cycle.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="border-b border-[#E7E0D2] bg-[#FAF8F5] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-400 font-bold">
          <tr>
            <th className="py-3 px-4">Timestamp</th>
            <th className="py-3 px-4">Seller Store</th>
            <th className="py-3 px-4">Operation</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Items / Results</th>
            <th className="py-3 px-4">Trigger</th>
            <th className="py-3 px-4 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.08]">
          {logs.map((log) => {
            const isSuccess = log.status === "SUCCESS";
            const isFailed = log.status === "FAILED";
            const isPartial = log.status === "PARTIAL";

            return (
              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {new Date(log.startedAt).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </td>
                <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                  {log.marketplaceAccount?.displayName || log.marketplaceAccount?.sellerName || "Amazon Account"}
                </td>
                <td className="py-3 px-4 font-medium">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
                    {log.syncType}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {isSuccess ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} /> Success
                    </span>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                      <XCircle size={14} /> Failed
                    </span>
                  ) : isPartial ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <AlertCircle size={14} /> Partial
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock size={14} /> Running
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs font-mono">
                  {log.itemsProcessed > 0 ? (
                    <span>
                      {log.itemsProcessed} processed (+{log.itemsCreated} / ~{log.itemsUpdated})
                      {log.itemsFailed > 0 && <span className="text-rose-600 ml-1">({log.itemsFailed} failed)</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">0 items</span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-slate-500 capitalize">
                  {log.triggeredBy.toLowerCase().replace("_", " ")}
                </td>
                <td className="py-3 px-4 text-right">
                  {log.errorMessage || log.details ? (
                    <button
                      type="button"
                      onClick={() => onViewError(log)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    >
                      <Eye size={13} /> View
                    </button>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

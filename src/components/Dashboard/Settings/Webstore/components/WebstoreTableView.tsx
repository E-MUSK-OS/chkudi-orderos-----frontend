"use client";

import React from "react";
import { Edit3, Trash2, ArrowUpDown } from "lucide-react";
import { Webstore, WebstoreFilterState } from "../types/webstore.types";
import { MarketplaceLogo } from "../utils/marketplaceLogos";

interface WebstoreTableViewProps {
  stores: Webstore[];
  loading: boolean;
  onModify: (store: Webstore) => void;
  onToggleStatus: (store: Webstore) => void;
  onDelete?: (store: Webstore) => void;
  togglingId?: string | null;
  filters: WebstoreFilterState;
  onSortToggle: (field: string) => void;
}

export default function WebstoreTableView({
  stores,
  loading,
  onModify,
  onToggleStatus,
  onDelete,
  togglingId,
  filters,
  onSortToggle,
}: WebstoreTableViewProps) {
  const columns = [
    { key: "code", label: "Code", width: "w-20" },
    { key: "storeName", label: "Webstore Name", width: "w-48" },
    { key: "marketplaceName", label: "Marketplace", width: "w-44" },
    { key: "billTo", label: "Company (Bill To)", width: "w-48" },
    { key: "skuCount", label: "No. of Sub-SKUs", width: "w-36" },
    { key: "registrationDate", label: "Registration Date", width: "w-36" },
    { key: "isActive", label: "Status", width: "w-28 text-center" },
    { key: "actions", label: "Actions", width: "w-28 text-right" },
  ];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-[#4A5568] dark:bg-[#1E293B] text-white font-bold text-xs select-none">
            <tr>
              {columns.map((col) => {
                const isSortable = col.key !== "actions" && col.key !== "code";
                const isSorted = filters.sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3 px-4 ${col.width}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortToggle(col.key)}
                        className="flex items-center gap-1.5 hover:text-[#E8C16D] transition-colors cursor-pointer"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown
                          className={`h-3 w-3 ${
                            isSorted ? "opacity-100 text-[#E8C16D]" : "opacity-60"
                          }`}
                        />
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                  <td className="py-3 px-4 text-center"><div className="h-4 w-12 mx-auto bg-slate-200 dark:bg-white/[0.08] rounded-full" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-6 w-16 ml-auto bg-slate-200 dark:bg-white/[0.08] rounded" /></td>
                </tr>
              ))
            ) : stores.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-400">
                  No webstores match the criteria.
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr
                  key={store.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Code */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    #{store.code}
                  </td>

                  {/* Webstore Name */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {store.storeName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {store.parentOrChild || "Parent"}
                    </div>
                  </td>

                  {/* Marketplace Channel */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MarketplaceLogo
                        name={store.marketplaceName}
                        logoUrl={store.marketplaceLogo}
                        className="w-6 h-6 shrink-0"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {store.marketplaceName}
                      </span>
                    </div>
                  </td>

                  {/* Company Name (Bill To) */}
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                    {store.billTo || "Chakudee Fashion"}
                  </td>

                  {/* Sub SKUs */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      {store.skuCount ?? 0}
                    </span>
                  </td>

                  {/* D.O.R. */}
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(store.registrationDate)}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={store.isActive}
                        disabled={togglingId === store.id}
                        onChange={() => onToggleStatus(store)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onModify(store)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[#0284C7] border border-[#0284C7]/40 hover:bg-[#0284C7]/10 dark:text-[#38BDF8] dark:border-[#38BDF8]/40 dark:hover:bg-[#38BDF8]/10 transition-all cursor-pointer"
                      >
                        Modify
                      </button>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(store)}
                          title="Delete Webstore"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

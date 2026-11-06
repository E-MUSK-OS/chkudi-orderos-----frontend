"use client";

import React from "react";
import { Trash2, ArrowUpDown, Eye, Edit3 } from "lucide-react";
import { Company, CompanyFilterState } from "../types/company.types";

interface CompanyTableViewProps {
  companies: Company[];
  loading: boolean;
  onModify: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onView?: (company: Company) => void;
  togglingId?: string | null;
  filters: CompanyFilterState;
  onSortToggle: (field: string) => void;
  pagination?: React.ReactNode;
}

export default function CompanyTableView({
  companies,
  loading,
  onModify,
  onToggleStatus,
  onDelete,
  onView,
  togglingId,
  filters,
  onSortToggle,
  pagination,
}: CompanyTableViewProps) {
  const columns = [
    { key: "companyCode", label: "Code", width: "w-20" },
    { key: "companyName", label: "Company Name", width: "w-48" },
    { key: "ownerName", label: "Owner Name", width: "w-44" },
    { key: "gstNumber", label: "GSTIN", width: "w-44" },
    { key: "state", label: "State / Zone", width: "w-36" },
    { key: "createdAt", label: "Registration Date", width: "w-36" },
    { key: "status", label: "Status", width: "w-28 text-center" },
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
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm relative">
      <div className="overflow-x-auto rounded-t-2xl sm:rounded-t-3xl">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] select-none">
            <tr>
              {columns.map((col) => {
                const isSortable = col.key !== "actions" && col.key !== "companyCode";
                const isSorted = filters.sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D] ${col.width}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortToggle(col.key)}
                        className="flex items-center gap-1.5 text-[#6A4D1D] hover:text-[#0A0E1A] dark:text-[#E8C16D] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown
                          className={`h-3 w-3 ${
                            isSorted ? "opacity-100 text-[#6A4D1D] dark:text-[#E8C16D]" : "opacity-40"
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
          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626]">
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
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                  No company profiles match the criteria.
                </td>
              </tr>
            ) : (
              companies.map((company) => {
                const isActive = company.status === "ACTIVE";
                return (
                  <tr
                    key={company.id}
                    className="hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      #{company.companyCode || "01"}
                    </td>

                    {/* Company Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {company.companyName || "Untitled Company"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {company.state || "Head Office"}
                      </div>
                    </td>

                    {/* Owner Name */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {company.ownerName || "Chakudee Fashion"}
                      </span>
                    </td>

                    {/* GSTIN */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      {company.gstNumber || "—"}
                    </td>

                    {/* State / Zone */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {company.state || company.stateCode || "Gujarat (24)"}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(company.registrationDate || company.createdAt)}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <label
                        className={`relative inline-flex items-center select-none ${
                          togglingId === company.id ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        title={
                          isActive
                            ? "Status: Active (Click to set as Draft)"
                            : "Status: Draft (Click to set as Active)"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          disabled={togglingId === company.id}
                          onChange={() => onToggleStatus(company)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                      </label>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(company)}
                            title="View Company Profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:text-[#E8C16D] dark:hover:bg-[#1A160E] transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onModify(company)}
                          title="Edit Company"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:text-[#E8C16D] dark:hover:bg-[#1A160E] transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(company)}
                            title="Delete Company"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  );
}

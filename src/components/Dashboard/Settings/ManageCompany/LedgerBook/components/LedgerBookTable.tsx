"use client";

import React from "react";
import {
  Eye,
  Edit3,
  Trash2,
  User,
  Calendar,
  Loader2,
  PenTool,
} from "lucide-react";
import { Ledger } from "../types/ledger.types";
import { getMediaUrl } from "@/lib/utils";

interface LedgerBookTableProps {
  ledgers: Ledger[];
  loading: boolean;
  visibleColumns: Record<string, boolean>;
  startIndex: number;
  onView: (ledger: Ledger) => void;
  onEdit: (ledger: Ledger) => void;
  onDelete: (ledger: Ledger) => void;
  pagination?: React.ReactNode;
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (_) {
    return null;
  }
}

export default function LedgerBookTable({
  ledgers,
  loading,
  visibleColumns,
  startIndex,
  onView,
  onEdit,
  onDelete,
  pagination,
}: LedgerBookTableProps) {
  const isColVisible = (colKey: string) => visibleColumns[colKey] !== false;

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm relative overflow-visible font-sans">
      <div className="w-full overflow-x-auto rounded-t-2xl sm:rounded-t-3xl">
        <table className="w-full text-left border-collapse">
          {/* Table Header matching OrderOS standard */}
          <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] select-none">
            <tr>
              {isColVisible("no") && (
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold text-[#6A4D1D] dark:text-[#E8C16D] w-12">No.</th>
              )}
              {isColVisible("logo") && (
                <th className="whitespace-nowrap px-3 py-3.5 text-center font-semibold text-[#6A4D1D] dark:text-[#E8C16D] w-14">Logo</th>
              )}
              {isColVisible("partyName") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">Ledger Name.</th>
              )}
              {isColVisible("accountCode") && (
                <th className="whitespace-nowrap px-3 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">Code.</th>
              )}
              {isColVisible("accountHead") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">Account Head.</th>
              )}
              {isColVisible("contactPerson") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">Contact Name.</th>
              )}
              {isColVisible("gstin") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">GSTN.</th>
              )}
              {isColVisible("email") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">EMail Id.</th>
              )}
              {isColVisible("addedBy") && (
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">Added / Edited By</th>
              )}
              {isColVisible("actions") && (
                <th className="whitespace-nowrap px-4 py-3.5 text-center font-semibold text-[#6A4D1D] dark:text-[#E8C16D] w-28">Actions</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs font-sans">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#F5C451]" />
                    <span className="text-xs font-medium">Loading ledger accounts...</span>
                  </div>
                </td>
              </tr>
            ) : ledgers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                  No Ledger Records Found
                </td>
              </tr>
            ) : (
              ledgers.map((item, index) => {
                const rowNumber = startIndex + index + 1;
                const hasGst = Boolean(item.gstin && item.gstin.trim() !== "" && item.gstin !== "-");
                const hasEmail = Boolean(item.email && item.email.trim() !== "");
                const creatorName = item.updatedByName || item.createdByName || null;
                const dateFormatted = formatDate(item.updatedAt || item.createdAt);
                const isEdited = Boolean(item.updatedByName);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06] transition-colors group"
                  >
                  {/* Row Number */}
                  {isColVisible("no") && (
                    <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
                      {rowNumber}
                    </td>
                  )}

                  {/* Logo Avatar */}
                  {isColVisible("logo") && (
                    <td className="py-3.5 px-3 text-center">
                      <div className="w-9 h-9 mx-auto rounded-full bg-slate-100 border border-[#E7E0D2] dark:bg-slate-800/80 dark:border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {item.logoUrl ? (
                          <img
                            src={getMediaUrl(item.logoUrl)}
                            alt={item.partyName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                      </div>
                    </td>
                  )}

                  {/* Ledger Name */}
                  {isColVisible("partyName") && (
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white tracking-wide">
                      <span
                        className="hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors cursor-pointer"
                        onClick={() => onView(item)}
                      >
                        {item.partyName}
                      </span>
                    </td>
                  )}

                  {/* Code */}
                  {isColVisible("accountCode") && (
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {item.accountCode || item.alias || "—"}
                    </td>
                  )}

                  {/* Account Head */}
                  {isColVisible("accountHead") && (
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium text-xs">
                      {item.accountHead || "Sundry Debtors"}
                    </td>
                  )}

                  {/* Contact Name */}
                  {isColVisible("contactPerson") && (
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium">
                      {item.contactPerson || "—"}
                    </td>
                  )}

                  {/* GSTN */}
                  {isColVisible("gstin") && (
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {hasGst ? (
                        <span className="text-slate-800 dark:text-slate-200">{item.gstin}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                  )}

                  {/* Email Id */}
                  {isColVisible("email") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                      {hasEmail ? (
                        <span className="text-slate-700 dark:text-slate-300 hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors">
                          {item.email}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Not specified</span>
                      )}
                    </td>
                  )}

                  {/* Added / Edited By */}
                  {isColVisible("addedBy") && (
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {creatorName || dateFormatted ? (
                        <div className="space-y-1 text-[11px]">
                          {creatorName && (
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-medium">
                              {isEdited ? (
                                <PenTool size={11} className="text-slate-400 shrink-0" />
                              ) : (
                                <User size={11} className="text-slate-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[140px]">{creatorName}</span>
                            </div>
                          )}
                          {dateFormatted && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              <Calendar size={11} className="text-slate-400 dark:text-slate-500 shrink-0" />
                              <span>{dateFormatted}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  )}

                  {/* Actions (View, Edit, Delete) */}
                  {isColVisible("actions") && (
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#B88728] hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="View Ledger Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:text-[#E8C16D] dark:hover:bg-[#1A160E] transition-colors cursor-pointer"
                          title="Edit Ledger"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Ledger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
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

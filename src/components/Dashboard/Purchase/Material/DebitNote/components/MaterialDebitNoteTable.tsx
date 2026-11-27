"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Edit2, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { MaterialPurchaseDebitNote } from "../types/materialDebitNote.types";
import { MaterialDebitNoteColumnOption } from "./MaterialDebitNoteFilters";

interface MaterialDebitNoteTableProps {
  debitNotes: MaterialPurchaseDebitNote[];
  loading: boolean;
  columns: MaterialDebitNoteColumnOption[];
  showSumRow: boolean;
  page: number;
  limit: number;
  total: number;
  sumTotalQty: number;
  sumNetAmount: number;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView?: (dn: MaterialPurchaseDebitNote) => void;
  onEdit: (dn: MaterialPurchaseDebitNote) => void;
  onDelete: (dn: MaterialPurchaseDebitNote) => void;
  isDiscount?: boolean;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;
}

export default function MaterialDebitNoteTable({
  debitNotes,
  loading,
  columns,
  showSumRow,
  page,
  limit,
  total,
  sumTotalQty,
  sumNetAmount,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
  isDiscount = false,
}: MaterialDebitNoteTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  useEffect(() => {
    if (!openMenuId) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const trigger = triggerRefs.current[openMenuId];
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!trigger || !trigger.contains(target))
      ) {
        setOpenMenuId(null);
      }
    };
    const handleScroll = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

  const updateSelectedIds = (newIds: string[]) => {
    if (onSelectionChange) onSelectionChange(newIds);
    else setInternalSelectedIds(newIds);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = debitNotes.map((d) => d.id);
      updateSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(debitNotes.map((d) => d.id));
      updateSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    updateSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const toggleRowMenu = (id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const btn = triggerRefs.current[id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 160 && rect.top > spaceBelow;
      setMenuPos({
        right: window.innerWidth - rect.right,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    }
    setOpenMenuId(id);
  };

  const isVisible = (id: string) => columns.find((c) => c.id === id)?.visible !== false;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleColCount = columns.filter((c) => c.visible !== false).length + 1;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
              {isVisible("no") && <th className="py-3 px-4 w-14">No.</th>}
              {isVisible("checkbox") && (
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all debit notes on this page"
                    checked={
                      debitNotes.length > 0 &&
                      debitNotes.every((d) => selectedIds.includes(d.id))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  />
                </th>
              )}
              {isVisible("debitNoteNo") && (
                <th className="py-3 px-4">{isDiscount ? "DDN No." : "Debit Note No."}</th>
              )}
              {isVisible("date") && <th className="py-3 px-4">Date.</th>}
              {isVisible("partyName") && <th className="py-3 px-4">Party Name.</th>}
              {isVisible("qty") && <th className="py-3 px-4 text-right">Quantity.</th>}
              {isVisible("netAmount") && <th className="py-3 px-4 text-right">Net Amount.</th>}
              {isVisible("invoiceType") && <th className="py-3 px-4 text-center w-36">Invoice Type.</th>}
              {isVisible("preparedBy") && <th className="py-3 px-4 w-32">Prepared By.</th>}
              <th className="py-3 px-4 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-400">
                  Loading material debit notes...
                </td>
              </tr>
            ) : debitNotes.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No data available
                    </p>
                    <p className="text-xs text-slate-400">
                      Click &ldquo;+ Create&rdquo; to create a{" "}
                      {isDiscount ? "discount" : "return"} debit note.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              debitNotes.map((dn, idx) => {
                const isSelected = selectedIds.includes(dn.id);
                return (
                  <tr
                    key={dn.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-[#FFF9EC]/70 dark:bg-[#E8C16D]/[0.06]"
                        : "hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {isVisible("no") && (
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {(page - 1) * limit + idx + 1}
                      </td>
                    )}
                    {isVisible("checkbox") && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(dn.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                        />
                      </td>
                    )}
                    {isVisible("debitNoteNo") && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {dn.debitNoteNo}
                        </span>
                      </td>
                    )}
                    {isVisible("date") && (
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {formatDate(dn.debitNoteDate)}
                      </td>
                    )}
                    {isVisible("partyName") && (
                      <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                        {dn.supplier?.partyName || dn.supplierName || "-"}
                      </td>
                    )}
                    {isVisible("qty") && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {Number(dn.totalQty || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("netAmount") && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                        ₹ {Number(dn.netAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("invoiceType") && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                          {dn.invoiceType || "URD Tax Invoice"}
                        </span>
                      </td>
                    )}
                    {isVisible("preparedBy") && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {dn.preparedBy || "-"}
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <button
                        ref={(el) => {
                          triggerRefs.current[dn.id] = el;
                        }}
                        type="button"
                        onClick={() => toggleRowMenu(dn.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                        title="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openMenuId === dn.id &&
                        menuPos &&
                        typeof document !== "undefined" &&
                        createPortal(
                          <div
                            ref={menuRef}
                            style={{
                              position: "fixed",
                              zIndex: 9999,
                              right: menuPos.right,
                              ...(menuPos.top !== undefined
                                ? { top: menuPos.top }
                                : { bottom: menuPos.bottom }),
                            }}
                            className="w-40 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#0F1626] shadow-2xl p-1.5 text-left space-y-0.5"
                          >
                            {onView && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onView(dn);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEdit(dn);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete(dn);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>,
                          document.body
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {showSumRow && (
            <tfoot>
              <tr className="bg-[#FFF9EC]/70 dark:bg-[#141A29]/80 border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-white">
                {isVisible("no") && <td className="py-2.5 px-4" />}
                {isVisible("checkbox") && <td className="py-2.5 px-3" />}
                {isVisible("debitNoteNo") && (
                  <td className="py-2.5 px-4 text-slate-500">Total. {total}</td>
                )}
                {isVisible("date") && <td className="py-2.5 px-4" />}
                {isVisible("partyName") && <td className="py-2.5 px-4" />}
                {isVisible("qty") && (
                  <td className="py-2.5 px-4 text-right font-mono text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumTotalQty || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("netAmount") && (
                  <td className="py-2.5 px-4 text-right font-mono text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumNetAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("invoiceType") && <td className="py-2.5 px-4" />}
                {isVisible("preparedBy") && <td className="py-2.5 px-4" />}
                <td className="py-2.5 px-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          options={[10, 20, 50, 100]}
          itemName="entries"
          variant="dark"
          className="shrink-0 border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]"
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}

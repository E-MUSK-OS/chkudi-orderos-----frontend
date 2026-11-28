"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  Edit2,
  Eye,
  FileMinus2,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Percent,
  Trash2,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { MaterialPurchaseInvoice } from "../types/materialInvoice.types";
import { MaterialInvoiceColumnOption } from "./MaterialInvoiceFilters";

interface MaterialInvoiceTableProps {
  invoices: MaterialPurchaseInvoice[];
  loading: boolean;
  columns: MaterialInvoiceColumnOption[];
  showSumRow: boolean;
  page: number;
  limit: number;
  total: number;
  sumTotalQty: number;
  sumNetAmount: number;
  sumDebitNoteAmount: number;
  sumDiscDebitNoteAmount: number;
  sumPaidAmount: number;
  sumBalanceAmount: number;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView?: (inv: MaterialPurchaseInvoice) => void;
  onEdit: (inv: MaterialPurchaseInvoice) => void;
  onDelete: (inv: MaterialPurchaseInvoice) => void;
  onDebitNote?: (inv: MaterialPurchaseInvoice) => void;
  onDiscountDebitNote?: (inv: MaterialPurchaseInvoice) => void;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function getPaymentStatusBadge(inv: MaterialPurchaseInvoice) {
  const balance = Number(
    inv.balanceAmount ??
      Math.max(
        0,
        Number(inv.netAmount || 0) -
          Number(inv.debitNoteAmount || 0) -
          Number(inv.discDebitNoteAmount || 0) -
          Number(inv.paidAmount || 0)
      )
  );

  if (balance <= 0 && Number(inv.netAmount || 0) > 0) {
    return {
      label: "Paid",
      className:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    };
  }

  const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date();
  const billDueDays = Number(inv.supplier?.billDueDays || 0);
  const dueDate = new Date(invDate);
  dueDate.setDate(dueDate.getDate() + billDueDays);
  const today = new Date();
  const diffDays = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays >= 0) {
    return {
      label: `In-Grace [${diffDays}]`,
      className:
        "bg-slate-100 text-slate-800 dark:bg-white text-slate-900 border border-slate-200 dark:border-white/20",
    };
  }

  return {
    label: `Due [${Math.abs(diffDays)}]`,
    className:
      "bg-rose-500/80 text-white border border-rose-500/40",
  };
}

export default function MaterialInvoiceTable({
  invoices,
  loading,
  columns,
  showSumRow,
  page,
  limit,
  total,
  sumTotalQty,
  sumNetAmount,
  sumDebitNoteAmount,
  sumDiscDebitNoteAmount,
  sumPaidAmount,
  sumBalanceAmount,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
  onDebitNote,
  onDiscountDebitNote,
}: MaterialInvoiceTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
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

  const toggleRowMenu = (invId: string) => {
    if (openMenuId === invId) {
      setOpenMenuId(null);
      return;
    }
    const btn = triggerRefs.current[invId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > spaceBelow;
      setMenuPos({
        right: window.innerWidth - rect.right,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    }
    setOpenMenuId(invId);
  };

  const updateSelectedIds = (newIds: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = invoices.map((i) => i.id);
      updateSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(invoices.map((i) => i.id));
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

  const isVisible = (id: string) => columns.find((c) => c.id === id)?.visible !== false;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleColCount = columns.filter((c) => c.visible !== false).length + 1;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1550px]">
          <thead>
            <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
              {isVisible("no") && <th className="py-3 px-4 w-14">No.</th>}
              {isVisible("checkbox") && (
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all invoices on this page"
                    checked={
                      invoices.length > 0 &&
                      invoices.every((i) => selectedIds.includes(i.id))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  />
                </th>
              )}
              {isVisible("invoiceNo") && <th className="py-3 px-4">Invoice No.</th>}
              {isVisible("date") && <th className="py-3 px-4">Date.</th>}
              {isVisible("party") && <th className="py-3 px-4">Party.</th>}
              {isVisible("partyBillNo") && <th className="py-3 px-4">Party Bill No.</th>}
              {isVisible("partyChallanNo") && (
                <th className="py-3 px-4">Party Challan No.</th>
              )}
              {isVisible("invoiceType") && <th className="py-3 px-4">Invoice Type.</th>}
              {isVisible("qty") && <th className="py-3 px-4 text-right">Qty.</th>}
              {isVisible("netAmount") && <th className="py-3 px-4 text-right">Net Amount.</th>}
              {isVisible("debitNote") && <th className="py-3 px-4 text-right">Debit Note.</th>}
              {isVisible("discDebitNote") && (
                <th className="py-3 px-4 text-right">Disc. Debit Note.</th>
              )}
              {isVisible("paid") && <th className="py-3 px-4 text-right">Paid.</th>}
              {isVisible("balance") && <th className="py-3 px-4 text-right">Balance.</th>}
              {isVisible("paymentStatus") && (
                <th className="py-3 px-4 text-center">Payment Status.</th>
              )}
              {isVisible("dnStatus") && <th className="py-3 px-4 text-center">DN Status.</th>}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-400">
                  Loading material purchase invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
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
                      Click &ldquo;+ Create&rdquo; to create a purchase material invoice.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => {
                const isSelected = selectedIds.includes(inv.id);
                const balance = Number(
                  inv.balanceAmount ??
                    Math.max(
                      0,
                      Number(inv.netAmount || 0) -
                        Number(inv.debitNoteAmount || 0) -
                        Number(inv.discDebitNoteAmount || 0) -
                        Number(inv.paidAmount || 0)
                    )
                );
                const statusBadge = getPaymentStatusBadge(inv);
                const hasDn =
                  inv.dnStatus === "Issued" ||
                  Number(inv.debitNoteAmount || 0) > 0 ||
                  Number(inv.discDebitNoteAmount || 0) > 0;

                return (
                  <tr
                    key={inv.id}
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
                          aria-label={`Select invoice ${inv.invoiceNo}`}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(inv.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                        />
                      </td>
                    )}
                    {isVisible("invoiceNo") && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {inv.invoiceNo}
                        </span>
                      </td>
                    )}
                    {isVisible("date") && (
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {formatDate(inv.invoiceDate)}
                      </td>
                    )}
                    {isVisible("party") && (
                      <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                        {inv.supplier?.partyName || inv.supplierName || "-"}
                      </td>
                    )}
                    {isVisible("partyBillNo") && (
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {inv.partyBillNo || "-"}
                      </td>
                    )}
                    {isVisible("partyChallanNo") && (
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {inv.partyChallanNo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-xs font-mono">
                            {inv.partyChallanNo}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                    {isVisible("invoiceType") && (
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {inv.invoiceType || "Tax Invoice"}
                      </td>
                    )}
                    {isVisible("qty") && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {Number(inv.totalQty || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("netAmount") && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                        ₹ {Number(inv.netAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("debitNote") && (
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ₹ {Number(inv.debitNoteAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("discDebitNote") && (
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ₹ {Number(inv.discDebitNoteAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("paid") && (
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ₹ {Number(inv.paidAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isVisible("balance") && (
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          balance > 0
                            ? "text-rose-500 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        ₹ {balance.toFixed(2)}
                      </td>
                    )}
                    {isVisible("paymentStatus") && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                    )}
                    {isVisible("dnStatus") && (
                      <td className="py-3 px-4 text-center">
                        <span
                          title={hasDn ? "Debit Note Issued" : "Pending"}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg ${
                            hasDn
                              ? "text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                              : "text-slate-400"
                          }`}
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <button
                        ref={(el) => {
                          triggerRefs.current[inv.id] = el;
                        }}
                        type="button"
                        onClick={() => toggleRowMenu(inv.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                        title="Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {openMenuId === inv.id &&
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
                            className="w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#0F1626] shadow-2xl p-1.5 text-left space-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                if (onView) onView(inv);
                                else onEdit(inv);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onEdit(inv);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                              <span>Edit</span>
                            </button>
                            {onDebitNote && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDebitNote(inv);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                              >
                                <FileMinus2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Debit Note</span>
                              </button>
                            )}
                            {onDiscountDebitNote && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDiscountDebitNote(inv);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                              >
                                <Percent className="w-3.5 h-3.5 text-slate-400" />
                                <span>Discount Debit Note</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete(inv);
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
                {isVisible("invoiceNo") && (
                  <td className="py-2.5 px-4 text-slate-500">Total. {total}</td>
                )}
                {isVisible("date") && <td className="py-2.5 px-4" />}
                {isVisible("party") && <td className="py-2.5 px-4" />}
                {isVisible("partyBillNo") && <td className="py-2.5 px-4" />}
                {isVisible("partyChallanNo") && <td className="py-2.5 px-4" />}
                {isVisible("invoiceType") && <td className="py-2.5 px-4" />}
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
                {isVisible("debitNote") && (
                  <td className="py-2.5 px-4 text-right font-mono whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumDebitNoteAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("discDebitNote") && (
                  <td className="py-2.5 px-4 text-right font-mono whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumDiscDebitNoteAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("paid") && (
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumPaidAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("balance") && (
                  <td className="py-2.5 px-4 text-right font-mono text-rose-500 dark:text-rose-400 whitespace-nowrap">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumBalanceAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("paymentStatus") && <td className="py-2.5 px-4" />}
                {isVisible("dnStatus") && <td className="py-2.5 px-4" />}
                <td className="py-2.5 px-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
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

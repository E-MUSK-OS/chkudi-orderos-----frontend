"use client";

import React, { useState, useMemo, useRef } from "react";
import { Edit2, Trash2, ArrowUpDown, ClipboardList } from "lucide-react";
import { PurchaseDebitNote } from "../types/purchaseDebitNote.types";
import Pagination from "@/components/ui/Pagination";

interface DebitNoteTableProps {
  debitNotes: PurchaseDebitNote[];
  loading: boolean;
  onEdit: (dn: PurchaseDebitNote) => void;
  onDelete: (dn: PurchaseDebitNote) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof PurchaseDebitNote;
  sortAsc?: boolean;
  onSortChange?: (field: keyof PurchaseDebitNote, asc: boolean) => void;
  showAggregations?: boolean;
}

export default function DebitNoteTable({
  debitNotes,
  loading,
  onEdit,
  onDelete,
  tableContainerRef,
  visibleColumns = {},
  sortField = "debitNoteDate",
  sortAsc = false,
  onSortChange,
  showAggregations = true,
}: DebitNoteTableProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = tableContainerRef || internalRef;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const isColVisible = (key: string) => visibleColumns[key] !== false;

  const sorted = useMemo(() => {
    const arr = [...debitNotes];
    arr.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === "debitNoteDate") {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [debitNotes, sortField, sortAsc]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return sorted.slice(start, start + limit);
  }, [sorted, page, limit]);

  const totalQty = useMemo(
    () => sorted.reduce((acc, dn) => acc + (Number(dn.totalQuantity) || 0), 0),
    [sorted]
  );
  const totalNet = useMemo(
    () => sorted.reduce((acc, dn) => acc + (Number(dn.netAmount) || 0), 0),
    [sorted]
  );

  const handleSort = (field: keyof PurchaseDebitNote) => {
    if (!onSortChange) return;
    if (sortField === field) onSortChange(field, !sortAsc);
    else onSortChange(field, true);
  };

  const visibleColCount = [
    "no",
    "debitNoteNo",
    "lotOrSku",
    "date",
    "partyName",
    "quantity",
    "netAmount",
    "invoiceType",
    "preparedBy",
    "actions",
  ].filter((k) => k === "no" || isColVisible(k)).length;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col">
      <div
        ref={resolvedRef}
        className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar"
      >
        <table className="w-full min-w-[960px] text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F1E8D0] dark:border-white/[0.08] text-[#6A4D1D] dark:text-[#E8C16D] font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-3 w-12 text-center">No.</th>
              {isColVisible("debitNoteNo") && (
                <th
                  onClick={() => handleSort("debitNoteNo")}
                  className="py-3.5 px-3 cursor-pointer hover:opacity-80 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    Debit Note No.
                  </span>
                </th>
              )}
              {isColVisible("lotOrSku") && (
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Lot No. &amp; Product SKU.
                </th>
              )}
              {isColVisible("date") && (
                <th
                  onClick={() => handleSort("debitNoteDate")}
                  className="py-3.5 px-3 cursor-pointer hover:opacity-80 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    Date.
                  </span>
                </th>
              )}
              {isColVisible("partyName") && (
                <th
                  onClick={() => handleSort("billingPartyName")}
                  className="py-3.5 px-3 cursor-pointer hover:opacity-80 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1">
                    Party Name.
                  </span>
                </th>
              )}
              {isColVisible("quantity") && (
                <th className="py-3.5 px-3 text-right whitespace-nowrap">
                  Quantity.
                </th>
              )}
              {isColVisible("netAmount") && (
                <th className="py-3.5 px-3 text-right whitespace-nowrap">
                  Net Amount.
                </th>
              )}
              {isColVisible("invoiceType") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Invoice Type.</th>
              )}
              {isColVisible("preparedBy") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Prepared By.</th>
              )}
              {isColVisible("actions") && (
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1E8D0]/60 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center text-slate-400">
                  Loading Debit Notes...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 text-[#B88728] dark:text-[#E8C16D]">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No data available
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((dn, idx) => {
                const skus = Array.from(
                  new Set((dn.items || []).map((it) => it.sku).filter(Boolean))
                );
                const formattedDate = dn.debitNoteDate
                  ? new Date(dn.debitNoteDate).toLocaleDateString("en-GB")
                  : "-";
                return (
                  <tr
                    key={dn.id}
                    className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    {isColVisible("debitNoteNo") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {dn.debitNoteNo}
                        </span>
                      </td>
                    )}
                    {isColVisible("lotOrSku") && (
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {skus.length > 0 ? skus.join(", ") : "-"}
                      </td>
                    )}
                    {isColVisible("date") && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        {formattedDate}
                      </td>
                    )}
                    {isColVisible("partyName") && (
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {dn.supplier?.partyName || dn.billingPartyName}
                      </td>
                    )}
                    {isColVisible("quantity") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                        {Number(dn.totalQuantity || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("netAmount") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                        ₹ {Number(dn.netAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("invoiceType") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                          {dn.invoiceType}
                        </span>
                      </td>
                    )}
                    {isColVisible("preparedBy") && (
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {dn.preparedBy || "-"}
                      </td>
                    )}
                    {isColVisible("actions") && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(dn)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Edit Debit Note"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(dn)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Debit Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {showAggregations && (
            <tfoot className="border-t border-[#E8C16D]/40 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
              <tr>
                <td className="py-2.5 px-3" />
                {isColVisible("debitNoteNo") && <td className="py-2.5 px-3" />}
                {isColVisible("lotOrSku") && <td className="py-2.5 px-3" />}
                {isColVisible("date") && <td className="py-2.5 px-3" />}
                {isColVisible("partyName") && (
                  <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                    Sum.
                  </td>
                )}
                {isColVisible("quantity") && (
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {totalQty.toFixed(2)}
                  </td>
                )}
                {isColVisible("netAmount") && (
                  <td className="py-2.5 px-3 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    {totalNet.toFixed(2)}
                  </td>
                )}
                {isColVisible("invoiceType") && <td className="py-2.5 px-3" />}
                {isColVisible("preparedBy") && <td className="py-2.5 px-3" />}
                {isColVisible("actions") && <td className="py-2.5 px-3" />}
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
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

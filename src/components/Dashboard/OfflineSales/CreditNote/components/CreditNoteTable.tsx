"use client";

import React, { useState, useMemo, useRef } from "react";
import { Edit2, Trash2, ArrowUpDown, ClipboardList } from "lucide-react";
import { SalesCreditNote } from "../types/salesCreditNote.types";
import Pagination from "@/components/ui/Pagination";

interface CreditNoteTableProps {
  creditNotes: SalesCreditNote[];
  loading: boolean;
  onEdit: (cn: SalesCreditNote) => void;
  onDelete: (cn: SalesCreditNote) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof SalesCreditNote;
  sortAsc?: boolean;
  onSortChange?: (field: keyof SalesCreditNote, asc: boolean) => void;
  showAggregations?: boolean;
}

export default function CreditNoteTable({
  creditNotes,
  loading,
  onEdit,
  onDelete,
  tableContainerRef,
  visibleColumns,
  sortField: externalSortField,
  sortAsc: externalSortAsc,
  onSortChange,
  showAggregations = true,
}: CreditNoteTableProps) {
  const [internalSortField, setInternalSortField] =
    useState<keyof SalesCreditNote>("creditNoteDate");
  const [internalSortAsc, setInternalSortAsc] = useState(false);

  const sortField = externalSortField ?? internalSortField;
  const sortAsc = externalSortAsc ?? internalSortAsc;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const internalTableRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = tableContainerRef ?? internalTableRef;

  const isColVisible = (key: string) =>
    visibleColumns ? visibleColumns[key] !== false : true;

  const handleSort = (field: keyof SalesCreditNote) => {
    const nextAsc = sortField === field ? !sortAsc : true;
    if (onSortChange) {
      onSortChange(field, nextAsc);
    } else {
      setInternalSortField(field);
      setInternalSortAsc(nextAsc);
    }
  };

  const sortedData = useMemo(() => {
    const arr = [...creditNotes];
    arr.sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [creditNotes, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, safePage, rowsPerPage]);

  const totalQtySum = useMemo(
    () => sortedData.reduce((s, cn) => s + (Number(cn.totalQuantity) || 0), 0),
    [sortedData]
  );
  const totalAmountSum = useMemo(
    () => sortedData.reduce((s, cn) => s + (Number(cn.netAmount) || 0), 0),
    [sortedData]
  );

  const visibleColCount = [
    "creditNoteNo",
    "date",
    "partyName",
    "quantity",
    "netAmount",
    "salesFor",
    "invoiceType",
    "preparedBy",
    "actions",
  ].filter(isColVisible).length + 1;

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F1E8D0] dark:border-white/[0.08] text-[#6A4D1D] dark:text-[#E8C16D] font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-3 text-center w-12">NO.</th>
              {isColVisible("creditNoteNo") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("creditNoteNo")}
                >
                  Credit Note No.
                </th>
              )}
              {isColVisible("date") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("creditNoteDate")}
                >
                  Date.
                </th>
              )}
              {isColVisible("partyName") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("billingPartyName")}
                >
                  Party Name.
                </th>
              )}
              {isColVisible("quantity") && (
                <th
                  className="py-3.5 px-3 text-right cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("totalQuantity")}
                >
                  Quantity.
                </th>
              )}
              {isColVisible("netAmount") && (
                <th
                  className="py-3.5 px-3 text-right cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("netAmount")}
                >
                  Net Amount.
                </th>
              )}
              {isColVisible("salesFor") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Sales For.</th>
              )}
              {isColVisible("invoiceType") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Invoice Type.</th>
              )}
              {isColVisible("preparedBy") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Prepared By.</th>
              )}
              {isColVisible("actions") && (
                <th className="py-3.5 px-3 text-center whitespace-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.06] text-xs">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-400">
                  Loading Credit Notes...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D]">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium">No data available</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((cn, idx) => {
                const rowNum = (safePage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr
                    key={cn.id}
                    className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                      {rowNum}
                    </td>
                    {isColVisible("creditNoteNo") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {cn.creditNoteNo}
                        </span>
                      </td>
                    )}
                    {isColVisible("date") && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(cn.creditNoteDate)}
                      </td>
                    )}
                    {isColVisible("partyName") && (
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {cn.party?.partyName || cn.billingPartyName}
                      </td>
                    )}
                    {isColVisible("quantity") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-white whitespace-nowrap">
                        {Number(cn.totalQuantity || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("netAmount") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                        ₹ {Number(cn.netAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("salesFor") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                          {cn.salesFor || "Product"}
                        </span>
                      </td>
                    )}
                    {isColVisible("invoiceType") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                          {cn.invoiceType}
                        </span>
                      </td>
                    )}
                    {isColVisible("preparedBy") && (
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {cn.preparedBy || "-"}
                      </td>
                    )}
                    {isColVisible("actions") && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(cn)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Edit Credit Note"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(cn)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Credit Note"
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
                {isColVisible("creditNoteNo") && <td className="py-2.5 px-3" />}
                {isColVisible("date") && <td className="py-2.5 px-3" />}
                {isColVisible("partyName") && (
                  <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                    Sum.
                  </td>
                )}
                {isColVisible("quantity") && (
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {totalQtySum.toFixed(2)}
                  </td>
                )}
                {isColVisible("netAmount") && (
                  <td className="py-2.5 px-3 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    {totalAmountSum.toFixed(2)}
                  </td>
                )}
                {isColVisible("salesFor") && <td className="py-2.5 px-3" />}
                {isColVisible("invoiceType") && <td className="py-2.5 px-3" />}
                {isColVisible("preparedBy") && <td className="py-2.5 px-3" />}
                {isColVisible("actions") && <td className="py-2.5 px-3" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Pagination
        variant="dark"
        itemName="entries"
        page={safePage}
        totalPages={totalPages}
        total={sortedData.length}
        limit={rowsPerPage}
        className="shrink-0 border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]"
        onPageChange={(p) => setCurrentPage(p)}
        onLimitChange={(lim) => {
          setRowsPerPage(lim);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}

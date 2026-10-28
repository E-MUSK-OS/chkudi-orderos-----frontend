"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Edit2, ArrowUpDown, Printer, FileText } from "lucide-react";
import { PurchaseInvoice } from "../types/purchaseInvoice.types";
import Pagination from "@/components/ui/Pagination";

interface PurchaseInvoiceTableProps {
  invoices: PurchaseInvoice[];
  loading: boolean;
  onEdit: (invoice: PurchaseInvoice) => void;
  onDelete?: (invoice: PurchaseInvoice) => void;
  onCreditNote?: (invoice: PurchaseInvoice) => void;
  onPrint?: (invoice: PurchaseInvoice) => void;
  onPrintMultiple?: (invoiceIds: string[]) => void;
}

function formatCurrency(num: number | undefined | null): string {
  const n = Number(num || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(num: number | undefined | null): string {
  const n = Number(num || 0);
  return n.toFixed(3);
}

function formatDateDisplay(dateVal: any): string {
  if (!dateVal) return "-";
  const str = String(dateVal);
  const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) {
    return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return str;

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function computeDueStatus(
  invoiceDateStr: string | undefined | null,
  status: string | undefined | null
): { text: string; isDue: boolean } {
  if (status === "Paid" || status === "Close" || status === "Closed") {
    return { text: "Paid", isDue: false };
  }
  if (!invoiceDateStr) return { text: status || "Generated", isDue: false };

  let invoiceDate: Date | null = null;
  const match = invoiceDateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    invoiceDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  } else {
    invoiceDate = new Date(invoiceDateStr);
  }

  if (isNaN(invoiceDate.getTime())) {
    return { text: status || "Generated", isDue: false };
  }

  const now = new Date();
  const diffTime = now.getTime() - invoiceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { text: `Due [-${diffDays}]`, isDue: true };
  } else if (diffDays === 0) {
    return { text: "Due Today", isDue: true };
  } else {
    return { text: `Due in ${Math.abs(diffDays)}d`, isDue: false };
  }
}

export default function PurchaseInvoiceTable({
  invoices,
  loading,
  onEdit,
  onCreditNote,
  onPrint,
  onPrintMultiple,
}: PurchaseInvoiceTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof PurchaseInvoice>("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleSort = (field: keyof PurchaseInvoice) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedInvoices = useMemo(() => {
    const list = [...invoices];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [invoices, sortField, sortAsc]);

  const total = sortedInvoices.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, invoices]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return sortedInvoices.slice(startIndex, startIndex + limit);
  }, [sortedInvoices, page, limit]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInvoices.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    if (onPrintMultiple) {
      onPrintMultiple(selectedIds);
    } else {
      window.print();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-left border-collapse">
          {/* Header matching legacy software columns */}
          <thead className="border-b border-[#E7E0D2] bg-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#080B11]">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-bold text-white dark:text-[#E8C16D] w-10">
                No.
              </th>

              <th
                onClick={() => handleSort("billingPartyName")}
                className="px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Party Name</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceType")}
                className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Invoice Type</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceNo")}
                className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>OC Invoice No</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceDate")}
                className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("challanNo")}
                className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>OC Challan No</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Challan Ref No</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("totalQuantity")}
                className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Qty</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("netAmount")}
                className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net Amount</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>CN Amount</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>DCN Amount</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>Received</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>Pending</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort("status")}
                className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>

              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] w-10 whitespace-nowrap">
                Edit
              </th>

              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] w-10 whitespace-nowrap">
                CN
              </th>

              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D] w-10">
                <button
                  type="button"
                  onClick={handlePrintSelected}
                  className="w-7 h-7 rounded bg-[#495057] hover:bg-[#343A40] text-white flex items-center justify-center mx-auto transition-colors cursor-pointer shadow-2xs"
                  title="Print Selected Invoices"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </th>

              <th className="px-3 py-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={
                    paginatedInvoices.length > 0 &&
                    paginatedInvoices.every((inv) => selectedIds.includes(inv.id))
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] dark:checked:bg-[#F5C451] cursor-pointer"
                />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={18} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    <span>Loading purchase invoices...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No purchase invoices found
                    </p>
                    <p className="text-xs text-slate-400">
                      Try adjusting filters or generate a new invoice.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv, index) => {
                const isSelected = selectedIds.includes(inv.id);
                const itemIndex = (page - 1) * limit + index + 1;
                const challanRef = inv.challan?.partyChallanNo || "-";
                const netAmt = Number(inv.netAmount || 0);
                const receivedAmt = Number((inv as any).receivedAmount || 0);
                const cnAmt = Number((inv as any).cnAmount || 0);
                const dcnAmt = Number((inv as any).dcnAmount || 0);
                const pendingAmt = Math.max(0, netAmt - (receivedAmt + cnAmt));
                const dueInfo = computeDueStatus(inv.invoiceDate, inv.status);

                return (
                  <tr
                    key={inv.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                      isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    {/* No. */}
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-xs">
                      {itemIndex}
                    </td>

                    {/* Party Name */}
                    <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {inv.billingPartyName || "-"}
                    </td>

                    {/* Invoice Type */}
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {inv.invoiceType || "Tax Invoice"}
                    </td>

                    {/* OC Invoice No */}
                    <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                      {inv.invoiceNo}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formatDateDisplay(inv.invoiceDate)}
                    </td>

                    {/* OC Challan No */}
                    <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
                      {inv.challanNo || "-"}
                    </td>

                    {/* Challan Ref No */}
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {challanRef}
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                      {formatQty(inv.totalQuantity)}
                    </td>

                    {/* Net Amount */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                      {formatCurrency(netAmt)}
                    </td>

                    {/* CN Amount */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formatCurrency(cnAmt)}
                    </td>

                    {/* DCN Amount */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formatCurrency(dcnAmt)}
                    </td>

                    {/* Received */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {formatCurrency(receivedAmt)}
                    </td>

                    {/* Pending */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap font-medium">
                      {formatCurrency(pendingAmt)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          dueInfo.isDue
                            ? "text-[#E53E3E] dark:text-[#F87171]"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {dueInfo.text}
                      </span>
                    </td>

                    {/* Edit Button */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onEdit(inv)}
                        title="Edit Invoice"
                        className="w-7 h-7 rounded bg-[#2B78E4] hover:bg-[#1E62C4] text-white inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* CN Button */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => (onCreditNote ? onCreditNote(inv) : onEdit(inv))}
                        title="Credit Note"
                        className="w-7 h-7 rounded bg-[#17A2B8] hover:bg-[#138496] text-white inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Print Button */}
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => (onPrint ? onPrint(inv) : window.print())}
                        title="Print Invoice"
                        className="w-7 h-7 rounded bg-[#495057] hover:bg-[#343A40] text-white inline-flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Checkbox */}
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(inv.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] dark:checked:bg-[#F5C451] cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && sortedInvoices.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> -{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> records
          </p>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalRecords={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            variant="gold"
          />
        </div>
      )}
    </div>
  );
}

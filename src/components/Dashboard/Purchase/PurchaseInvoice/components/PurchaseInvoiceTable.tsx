"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Edit2, ArrowUpDown, Printer, FileText, Eye, Trash2 } from "lucide-react";
import { PurchaseInvoice } from "../types/purchaseInvoice.types";
import Pagination from "@/components/ui/Pagination";

interface PurchaseInvoiceTableProps {
  invoices: PurchaseInvoice[];
  loading: boolean;
  onEdit: (invoice: PurchaseInvoice) => void;
  onView?: (invoice: PurchaseInvoice) => void;
  onDelete?: (invoice: PurchaseInvoice) => void;
  onCreditNote?: (invoice: PurchaseInvoice) => void;
  onPrint?: (invoice: PurchaseInvoice) => void;
  onPrintMultiple?: (invoiceIds: string[]) => void;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
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
  onView,
  onDelete,
  onCreditNote,
  onPrint,
  onPrintMultiple,
  selectedIds: propSelectedIds,
  onSelectionChange,
}: PurchaseInvoiceTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = propSelectedIds !== undefined ? propSelectedIds : internalSelectedIds;

  const updateSelection = (newIds: string[]) => {
    if (propSelectedIds === undefined) {
      setInternalSelectedIds(newIds);
    }
    onSelectionChange?.(newIds);
  };
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
      const pageIds = paginatedInvoices.map((inv) => inv.id);
      const newIds = Array.from(new Set([...selectedIds, ...pageIds]));
      updateSelection(newIds);
    } else {
      const pageIdSet = new Set(paginatedInvoices.map((inv) => inv.id));
      const newIds = selectedIds.filter((id) => !pageIdSet.has(id));
      updateSelection(newIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    updateSelection(newIds);
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
              <th className="px-4 py-3.5 text-center w-12">
                <input
                  type="checkbox"
                  checked={
                    paginatedInvoices.length > 0 &&
                    paginatedInvoices.every((inv) => selectedIds.includes(inv.id))
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  style={{ accentColor: "#0A0E1A" }}
                />
              </th>

              <th className="px-3 py-3 text-center text-xs font-semibold text-[#E8C16D] w-10">
                No.
              </th>

              <th
                onClick={() => handleSort("billingPartyName")}
                className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Party Name</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "billingPartyName" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceType")}
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Invoice Type</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceType" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceNo")}
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>OC Invoice No</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("invoiceDate")}
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceDate" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("challanNo")}
                className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>OC Challan No</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "challanNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Challan Ref No</span>
                </div>
              </th>

              <th
                onClick={() => handleSort("totalQuantity")}
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Qty</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "totalQuantity" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("netAmount")}
                className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net Amount</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "netAmount" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>CN Amount</span>
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>DCN Amount</span>
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>Received</span>
                </div>
              </th>

              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <span>Pending</span>
                </div>
              </th>

              <th
                onClick={() => handleSort("status")}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "status" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Actions</span>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePrintSelected}
                      title={`Print ${selectedIds.length} Selected Invoices`}
                      className="inline-flex items-center justify-center p-1 rounded-lg text-[#E8C16D] hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8C16D] dark:border-[#F5C451] border-t-transparent" />
                    <span>Loading purchase invoices...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-500 dark:text-slate-400">
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
                    {/* Checkbox Column (First) */}
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(inv.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  style={{ accentColor: "#0A0E1A" }}
                      />
                    </td>

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

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(inv)}
                            title="View Invoice Details"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] transition-all dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06] cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(inv)}
                          title="Edit Invoice"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] transition-all dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06] cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => (onCreditNote ? onCreditNote(inv) : onEdit(inv))}
                          title="Credit Note"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-[#B88728] hover:text-[#9A701E] hover:bg-[#FFF9EC] transition-all dark:text-[#F5C451] dark:hover:text-[#F5C451] dark:hover:bg-amber-500/10 cursor-pointer"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => (onPrint ? onPrint(inv) : window.print())}
                          title="Print Invoice"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] transition-all dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06] cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(inv)}
                            title="Delete Invoice"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
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

      {/* Pagination Footer */}
      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={total}
          total={total}
          limit={limit}
          pageSize={limit}
          itemName="records"
          variant="light"
          options={[10, 20, 50, 100]}
          className="border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onPageSizeChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

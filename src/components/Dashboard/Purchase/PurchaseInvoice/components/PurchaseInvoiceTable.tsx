"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Edit2,
  ArrowUpDown,
  Printer,
  FileText,
  Eye,
  Trash2,
  Package,
  Receipt,
  CreditCard,
  Scale,
  ClipboardList,
} from "lucide-react";
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
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof PurchaseInvoice;
  sortAsc?: boolean;
  onSortChange?: (field: keyof PurchaseInvoice, asc: boolean) => void;
  showAggregations?: boolean;
  totalSumQty?: number;
  totalSumNetAmount?: number;
  totalSumPaid?: number;
  totalSumBalance?: number;
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
  return n % 1 === 0 ? String(n) : n.toFixed(2);
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
): { text: string; isDue: boolean; isPaid: boolean } {
  if (status === "Paid" || status === "Close" || status === "Closed") {
    return { text: "Paid", isDue: false, isPaid: true };
  }
  if (!invoiceDateStr) return { text: status || "Pending", isDue: false, isPaid: false };

  let invoiceDate: Date | null = null;
  const match = invoiceDateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    invoiceDate = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  } else {
    invoiceDate = new Date(invoiceDateStr);
  }

  if (isNaN(invoiceDate.getTime())) {
    return { text: status || "Pending", isDue: false, isPaid: false };
  }

  const now = new Date();
  const diffTime = now.getTime() - invoiceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { text: `Due [-${diffDays}]`, isDue: true, isPaid: false };
  } else if (diffDays === 0) {
    return { text: "Due Today", isDue: true, isPaid: false };
  } else {
    return { text: `Due in ${Math.abs(diffDays)}d`, isDue: false, isPaid: false };
  }
}

function getLotOrSkuDisplay(inv: PurchaseInvoice): { text: string; title?: string } {
  // 1. Check if linked challan has lotNo
  if (inv.challan?.items && Array.isArray(inv.challan.items)) {
    const challanLots: string[] = Array.from(
      new Set<string>(
        inv.challan.items
          .map((it: any) => it.lotNo?.trim())
          .filter((v: any): v is string => Boolean(v && v.length > 0))
      )
    );
    if (challanLots.length > 0) {
      return { text: challanLots[0], title: challanLots.join(", ") };
    }
  }

  // 2. Check if invoice items have lotNo
  if (inv.items && Array.isArray(inv.items)) {
    const itemLots: string[] = Array.from(
      new Set<string>(
        inv.items
          .map((it: any) => it.lotNo?.trim())
          .filter((v: any): v is string => Boolean(v && v.length > 0))
      )
    );
    if (itemLots.length > 0) {
      return { text: itemLots[0], title: itemLots.join(", ") };
    }
  }

  // 3. Otherwise show Product SKU
  if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
    const skus: string[] = Array.from(
      new Set<string>(
        inv.items
          .map((it) => it.sku?.trim())
          .filter((v): v is string => Boolean(v && v.length > 0))
      )
    );
    if (skus.length > 0) {
      return { text: skus[0], title: skus.length > 1 ? skus.join(", ") : undefined };
    }
  }

  return { text: "-" };
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
  tableContainerRef,
  visibleColumns = {},
  sortField: controlledSortField,
  sortAsc: controlledSortAsc,
  onSortChange,
  showAggregations = true,
  totalSumQty: propTotalSumQty,
  totalSumNetAmount: propTotalSumNetAmount,
  totalSumPaid: propTotalSumPaid,
  totalSumBalance: propTotalSumBalance,
}: PurchaseInvoiceTableProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = tableContainerRef || internalRef;
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = propSelectedIds !== undefined ? propSelectedIds : internalSelectedIds;

  const updateSelection = (newIds: string[]) => {
    if (propSelectedIds === undefined) {
      setInternalSelectedIds(newIds);
    }
    onSelectionChange?.(newIds);
  };

  const isColVisible = (key: string) => visibleColumns[key] !== false;

  const [internalSortField, setInternalSortField] = useState<keyof PurchaseInvoice>("createdAt");
  const [internalSortAsc, setInternalSortAsc] = useState<boolean>(false);
  const sortField = controlledSortField ?? internalSortField;
  const sortAsc = controlledSortAsc ?? internalSortAsc;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, limit, resolvedRef]);

  const handleSort = (field: keyof PurchaseInvoice) => {
    const nextAsc = sortField === field ? !sortAsc : true;
    if (onSortChange) {
      onSortChange(field, nextAsc);
    } else {
      setInternalSortField(field);
      setInternalSortAsc(nextAsc);
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
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return sortedInvoices.slice(startIndex, startIndex + limit);
  }, [sortedInvoices, page, limit]);

  // Aggregate sums
  const calculatedSumQty = useMemo(() => {
    return propTotalSumQty !== undefined
      ? propTotalSumQty
      : invoices.reduce((acc, inv) => acc + (Number(inv.totalQuantity) || 0), 0);
  }, [invoices, propTotalSumQty]);

  const calculatedSumNetAmount = useMemo(() => {
    return propTotalSumNetAmount !== undefined
      ? propTotalSumNetAmount
      : invoices.reduce((acc, inv) => acc + (Number(inv.netAmount) || 0), 0);
  }, [invoices, propTotalSumNetAmount]);

  const calculatedSumPaid = useMemo(() => {
    return propTotalSumPaid !== undefined
      ? propTotalSumPaid
      : invoices.reduce(
          (acc, inv) =>
            acc + (inv.hasReceipt && inv.receivedAmount ? Number(inv.receivedAmount) : 0),
          0
        );
  }, [invoices, propTotalSumPaid]);

  const calculatedSumBalance = useMemo(() => {
    return propTotalSumBalance !== undefined
      ? propTotalSumBalance
      : invoices.reduce(
          (acc, inv) =>
            acc +
            Math.max(
              0,
              Number(inv.netAmount || 0) -
                (inv.hasReceipt && inv.receivedAmount ? Number(inv.receivedAmount) : 0)
            ),
          0
        );
  }, [invoices, propTotalSumBalance]);

  // Dynamic prefix/suffix column spans for aggregation footer
  const prefixCols = [
    isColVisible("no"),
    isColVisible("invoiceNo"),
    isColVisible("lotSku"),
    isColVisible("date"),
    isColVisible("party"),
    isColVisible("partyBillNo"),
    isColVisible("invoiceType"),
  ];
  const prefixSpan = prefixCols.filter(Boolean).length;

  const suffixCols = [
    isColVisible("paymentStatus"),
    isColVisible("dnStatus"),
    isColVisible("actions"),
  ];
  const suffixSpan = suffixCols.filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div
        ref={resolvedRef}
        className="w-full overflow-x-auto min-h-0 overflow-y-auto custom-scrollbar overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[1300px] text-left border-collapse">
          {/* Header matching Image 2 columns */}
          <thead className="lg:sticky lg:top-0 z-10 border-b border-[#F5E6BE] bg-[#FEFAEE] dark:bg-[#080B11] dark:border-white/[0.08] select-none text-[#6A4D1D] dark:text-white font-bold text-xs shadow-xs">
            <tr>
              {/* 1. No. */}
              {isColVisible("no") && (
                <th className="px-3.5 py-3 text-center text-xs font-bold text-[#6A4D1D] dark:text-[#E8C16D] w-12 whitespace-nowrap">
                  No.
                </th>
              )}

              {/* 2. Invoice No. */}
              {isColVisible("invoiceNo") && (
                <th
                  onClick={() => handleSort("invoiceNo")}
                  className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Invoice No.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 3. Lot No. & Product SKU */}
              {isColVisible("lotSku") && (
                <th className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  Lot No. & Product SKU
                </th>
              )}

              {/* 4. Date. */}
              {isColVisible("date") && (
                <th
                  onClick={() => handleSort("invoiceDate")}
                  className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceDate" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 5. Party. */}
              {isColVisible("party") && (
                <th
                  onClick={() => handleSort("billingPartyName")}
                  className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Party.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "billingPartyName" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 6. Party Bill No. */}
              {isColVisible("partyBillNo") && (
                <th
                  onClick={() => handleSort("challanNo")}
                  className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Party Bill No.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "challanNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 7. Invoice Type. */}
              {isColVisible("invoiceType") && (
                <th
                  onClick={() => handleSort("invoiceType")}
                  className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Invoice Type.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "invoiceType" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 8. Qty. */}
              {isColVisible("qty") && (
                <th
                  onClick={() => handleSort("totalQuantity")}
                  className="px-3.5 py-3 text-right font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <Package className="h-3.5 w-3.5 opacity-60" />
                    <span>Qty.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "totalQuantity" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 9. Net Amount. */}
              {isColVisible("netAmount") && (
                <th
                  onClick={() => handleSort("netAmount")}
                  className="px-3.5 py-3 text-right font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <Receipt className="h-3.5 w-3.5 opacity-60" />
                    <span>Net Amount.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "netAmount" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 10. Debit Note. */}
              {isColVisible("debitNote") && (
                <th className="px-3.5 py-3 text-right font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <FileText className="h-3.5 w-3.5 opacity-60" />
                    <span>Debit Note.</span>
                  </div>
                </th>
              )}

              {/* 11. Paid. */}
              {isColVisible("paid") && (
                <th className="px-3.5 py-3 text-right font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 opacity-60" />
                    <span>Paid.</span>
                  </div>
                </th>
              )}

              {/* 12. Balance. */}
              {isColVisible("balance") && (
                <th className="px-3.5 py-3 text-right font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Scale className="h-3.5 w-3.5 opacity-60" />
                    <span>Balance.</span>
                  </div>
                </th>
              )}

              {/* 13. Payment Status. */}
              {isColVisible("paymentStatus") && (
                <th
                  onClick={() => handleSort("status")}
                  className="px-3.5 py-3 text-center font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Payment Status.</span>
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "status" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                  </div>
                </th>
              )}

              {/* 14. DN Status. */}
              {isColVisible("dnStatus") && (
                <th className="px-3.5 py-3 text-center font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  DN Status.
                </th>
              )}

              {/* 15. Actions */}
              {isColVisible("actions") && (
                <th className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm dark:divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={15} className="py-24 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] dark:border-[#F5C451] border-t-transparent" />
                    <span className="font-semibold text-xs">Loading purchase invoices...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 text-[#B88728] dark:text-[#E8C16D] mb-3 shadow-xs">
                      <ClipboardList className="h-8 w-8 text-[#B88728] dark:text-[#E8C16D]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No data available
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv, index) => {
                const isSelected = selectedIds.includes(inv.id);
                const dueInfo = computeDueStatus(inv.invoiceDate, inv.status);
                const lotSkuInfo = getLotOrSkuDisplay(inv);
                const paidAmount =
                  inv.hasReceipt && inv.receivedAmount ? Number(inv.receivedAmount) : 0;
                const balanceAmount = Math.max(0, Number(inv.netAmount || 0) - paidAmount);

                return (
                  <tr
                    key={inv.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                      isSelected
                        ? "bg-[#FFF9EC]/60 dark:bg-[#1A160E]/50"
                        : index % 2 === 1
                        ? "bg-[#FAF8F5]/50 dark:bg-white/[0.01]"
                        : "bg-white dark:bg-[#0F1626]"
                    }`}
                  >
                    {/* 1. No. */}
                    {isColVisible("no") && (
                      <td className="px-3.5 py-2.5 text-center text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {(page - 1) * limit + index + 1}
                      </td>
                    )}

                    {/* 2. Invoice No. */}
                    {isColVisible("invoiceNo") && (
                      <td className="px-3.5 py-2.5 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        {inv.invoiceNo || "-"}
                      </td>
                    )}

                    {/* 3. Lot No. & Product SKU */}
                    {isColVisible("lotSku") && (
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span
                          title={lotSkuInfo.title || lotSkuInfo.text}
                          className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs"
                        >
                          {lotSkuInfo.text}
                        </span>
                      </td>
                    )}

                    {/* 4. Date. */}
                    {isColVisible("date") && (
                      <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateDisplay(inv.invoiceDate)}
                      </td>
                    )}

                    {/* 5. Party. */}
                    {isColVisible("party") && (
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        <span title={inv.billingPartyName}>
                          {inv.billingPartyName || "-"}
                        </span>
                      </td>
                    )}

                    {/* 6. Party Bill No. */}
                    {isColVisible("partyBillNo") && (
                      <td className="px-3.5 py-2.5 font-medium font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {inv.challan?.partyChallanNo || inv.challanNo || "-"}
                      </td>
                    )}

                    {/* 7. Invoice Type. */}
                    {isColVisible("invoiceType") && (
                      <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {inv.invoiceType || "Tax Invoice"}
                      </td>
                    )}

                    {/* 8. Qty. */}
                    {isColVisible("qty") && (
                      <td className="px-3.5 py-2.5 text-right font-medium font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatQty(inv.totalQuantity)}
                      </td>
                    )}

                    {/* 9. Net Amount. */}
                    {isColVisible("netAmount") && (
                      <td className="px-3.5 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        ₹{formatCurrency(inv.netAmount)}
                      </td>
                    )}

                    {/* 10. Debit Note. */}
                    {isColVisible("debitNote") && (
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        0.00
                      </td>
                    )}

                    {/* 11. Paid. */}
                    {isColVisible("paid") && (
                      <td className="px-3.5 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold font-mono whitespace-nowrap">
                        {paidAmount > 0 ? `₹${formatCurrency(paidAmount)}` : "0.00"}
                      </td>
                    )}

                    {/* 12. Balance. */}
                    {isColVisible("balance") && (
                      <td className="px-3.5 py-2.5 text-right font-bold font-mono text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                        ₹{formatCurrency(balanceAmount)}
                      </td>
                    )}

                    {/* 13. Payment Status. */}
                    {isColVisible("paymentStatus") && (
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            dueInfo.isPaid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : dueInfo.isDue
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-[#B88728] dark:text-[#E8C16D] border-amber-500/20"
                          }`}
                        >
                          {dueInfo.text}
                        </span>
                      </td>
                    )}

                    {/* 14. DN Status. */}
                    {isColVisible("dnStatus") && (
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                          -
                        </span>
                      </td>
                    )}

                    {/* 15. Actions */}
                    {isColVisible("actions") && (
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(inv)}
                              title="View Invoice Details"
                              className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(inv)}
                            title="Edit Invoice"
                            className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => (onPrint ? onPrint(inv) : window.print())}
                            title="Print Invoice"
                            className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(inv)}
                              title="Delete Invoice"
                              className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}

            {/* Bottom Aggregations Row matching Image 2 */}
            {!loading && invoices.length > 0 && showAggregations && (
              <tr className="border-t-2 border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] font-bold text-xs select-none">
                {prefixSpan > 0 && (
                  <td colSpan={prefixSpan} className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    Total:
                  </td>
                )}

                {/* Qty */}
                {isColVisible("qty") && (
                  <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-semibold text-[11px]">Sum.</span>
                    {formatQty(calculatedSumQty)}
                  </td>
                )}

                {/* Net Amount */}
                {isColVisible("netAmount") && (
                  <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-semibold text-[11px]">Sum.</span>
                    ₹{formatCurrency(calculatedSumNetAmount)}
                  </td>
                )}

                {/* Debit Note */}
                {isColVisible("debitNote") && (
                  <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-semibold text-[11px]">Sum.</span>
                    0.00
                  </td>
                )}

                {/* Paid */}
                {isColVisible("paid") && (
                  <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-semibold text-[11px]">Sum.</span>
                    ₹{formatCurrency(calculatedSumPaid)}
                  </td>
                )}

                {/* Balance */}
                {isColVisible("balance") && (
                  <td className="px-3.5 py-3 text-right whitespace-nowrap font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                    <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-sans font-semibold text-[11px]">Sum.</span>
                    ₹{formatCurrency(calculatedSumBalance)}
                  </td>
                )}

                {suffixSpan > 0 && <td colSpan={suffixSpan} className="px-4 py-3" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching Image 2 */}
      {!loading && (
        <div className="shrink-0">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalRecords={total}
            total={total}
            limit={limit}
            pageSize={limit}
            itemName="entries"
            variant="dark"
            options={[10, 20, 50, 100]}
            className="border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]"
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
        </div>
      )}
    </div>
  );
}

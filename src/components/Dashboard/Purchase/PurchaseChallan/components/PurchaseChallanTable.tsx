"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ReceiptText,
  Printer,
} from "lucide-react";
import { PurchaseChallan } from "../types/purchaseChallan.types";
import Pagination from "@/components/ui/Pagination";

interface PurchaseChallanTableProps {
  challans: PurchaseChallan[];
  loading: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onEdit: (challan: PurchaseChallan) => void;
  onDelete?: (challan: PurchaseChallan) => void;
  onView?: (challan: PurchaseChallan) => void;
  onPrint?: (challan: PurchaseChallan) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  totalSumQty?: number;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof PurchaseChallan;
  sortAsc?: boolean;
  onSortChange?: (field: keyof PurchaseChallan, asc: boolean) => void;
  showAggregations?: boolean;
}

export const getPartyChallanDisplay = (ch: PurchaseChallan): string => {
  if (ch.partyChallanNo && ch.partyChallanNo.trim()) {
    return ch.partyChallanNo.trim();
  }
  if (ch.items && ch.items.length > 0) {
    const itemNos = Array.from(
      new Set(
        ch.items
          .map((it) => it.partyChallanNo?.trim())
          .filter((val): val is string => Boolean(val && val.length > 0))
      )
    );
    if (itemNos.length > 0) {
      return itemNos.join(", ");
    }
  }
  return "";
};

export const getLotOrSkuDisplay = (
  ch: PurchaseChallan
): { text: string; isLot: boolean; title?: string } => {
  // 1. If Challan level lotNo exists, display Lot No
  if (ch.lotNo && ch.lotNo.trim()) {
    return { text: ch.lotNo.trim(), isLot: true };
  }

  // 2. If any item has lotNo, display Lot No
  if (ch.items && ch.items.length > 0) {
    const itemLotNos = Array.from(
      new Set(
        ch.items
          .map((it) => it.lotNo?.trim())
          .filter((val): val is string => Boolean(val && val.length > 0))
      )
    );
    if (itemLotNos.length > 0) {
      return { text: itemLotNos.join(", "), isLot: true };
    }
  }

  // 3. Otherwise display Product SKU (single display: one time)
  if (ch.items && ch.items.length > 0) {
    const itemSkus = Array.from(
      new Set(
        ch.items
          .map((it) => it.sku?.trim())
          .filter((val): val is string => Boolean(val && val.length > 0))
      )
    );
    if (itemSkus.length > 0) {
      return {
        text: itemSkus[0],
        isLot: false,
        title: itemSkus.length > 1 ? itemSkus.join(", ") : undefined,
      };
    }
  }

  return { text: "-", isLot: false };
};

export default function PurchaseChallanTable({
  challans,
  loading,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onPrint,
  tableContainerRef,
  totalSumQty,
  visibleColumns = {},
  sortField: controlledSortField,
  sortAsc: controlledSortAsc,
  onSortChange,
  showAggregations = true,
}: PurchaseChallanTableProps) {
  const router = useRouter();
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedRef = tableContainerRef || internalRef;
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  const updateSelectedIds = (newIds: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  };

  const isColVisible = (key: string) => visibleColumns[key] !== false;

  const [internalSortField, setInternalSortField] = useState<keyof PurchaseChallan>("createdAt");
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

  const handleSort = (field: keyof PurchaseChallan) => {
    const nextAsc = sortField === field ? !sortAsc : true;
    if (onSortChange) {
      onSortChange(field, nextAsc);
    } else {
      setInternalSortField(field);
      setInternalSortAsc(nextAsc);
    }
  };

  const sortedChallans = useMemo(() => {
    return [...challans].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";

      if (sortField === "partyChallanNo") {
        aVal = getPartyChallanDisplay(a);
        bVal = getPartyChallanDisplay(b);
      }

      if (typeof aVal === "string") {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortAsc ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });
  }, [challans, sortField, sortAsc]);

  const total = sortedChallans.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, challans]);

  const paginatedChallans = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return sortedChallans.slice(startIndex, startIndex + limit);
  }, [sortedChallans, page, limit]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedChallans.map((c) => c.id);
      updateSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedChallans.map((c) => c.id));
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

  // Calculate sum of total quantity for the footer
  const calculatedSum = useMemo(() => {
    if (totalSumQty !== undefined && totalSumQty !== null) {
      return totalSumQty;
    }
    return challans.reduce((acc, c) => acc + (Number(c.totalReceivedQty) || 0), 0);
  }, [totalSumQty, challans]);

  // Compute column spans for footer
  const prefixCols = [
    isColVisible("no"),
    isColVisible("checkbox"),
    isColVisible("challanNo"),
    isColVisible("lotSku"),
    isColVisible("date"),
    isColVisible("party"),
    isColVisible("contact"),
    isColVisible("partyChallanNo"),
  ];
  const prefixSpan = prefixCols.filter(Boolean).length;

  const suffixCols = [
    isColVisible("challanFor"),
    isColVisible("preparedBy"),
    isColVisible("status"),
    isColVisible("actions"),
  ];
  const suffixSpan = suffixCols.filter(Boolean).length;

  const totalColCount =
    prefixSpan + (isColVisible("totalQty") ? 1 : 0) + suffixSpan;

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div
        ref={resolvedRef}
        className="w-full overflow-x-auto min-h-0 overflow-y-auto custom-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[1100px] text-left border-collapse">
          {/* Header styled with SaaS Dark Obsidian & Gold palette */}
          <thead className="lg:sticky lg:top-0 z-10 border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] select-none text-[#6A4D1D] dark:text-[#E8C16D] font-bold shadow-xs whitespace-nowrap text-xs">
            <tr>
              {/* 1. No. */}
              {isColVisible("no") && (
                <th className="px-3.5 py-3.5 text-center w-12 font-bold uppercase tracking-wider">
                  No.
                </th>
              )}

              {/* 2. Checkbox */}
              {isColVisible("checkbox") && (
                <th className="px-3 py-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedChallans.length > 0 &&
                      paginatedChallans.every((c) => selectedIds.includes(c.id))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                    style={{ accentColor: "#0A0E1A" }}
                  />
                </th>
              )}

              {/* 3. Challan No. */}
              {isColVisible("challanNo") && (
                <th
                  onClick={() => handleSort("challanNo")}
                  className="px-4 py-3.5 text-left font-bold uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Challan No.</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        sortField === "challanNo"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 4. Lot No. & Product SKU */}
              {isColVisible("lotSku") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Lot No. & Product SKU
                </th>
              )}

              {/* 5. Date. */}
              {isColVisible("date") && (
                <th
                  onClick={() => handleSort("challanDate")}
                  className="px-4 py-3.5 text-left font-bold uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date.</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        sortField === "challanDate"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 6. Party. */}
              {isColVisible("party") && (
                <th
                  onClick={() => handleSort("supplierName")}
                  className="px-4 py-3.5 text-left font-bold uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Party.</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        sortField === "supplierName"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 7. Contact No. */}
              {isColVisible("contact") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Contact No.
                </th>
              )}

              {/* 8. Party Challan No. */}
              {isColVisible("partyChallanNo") && (
                <th
                  onClick={() => handleSort("partyChallanNo")}
                  className="px-4 py-3.5 text-left font-bold uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Party Challan No.</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        sortField === "partyChallanNo"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 9. Total Qty. */}
              {isColVisible("totalQty") && (
                <th
                  onClick={() => handleSort("totalReceivedQty")}
                  className="px-4 py-3.5 text-center font-bold uppercase tracking-wider cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Total Qty.</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        sortField === "totalReceivedQty"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 10. Challan For. */}
              {isColVisible("challanFor") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Challan For.
                </th>
              )}

              {/* 11. Prepared By. */}
              {isColVisible("preparedBy") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Prepared By.
                </th>
              )}

              {/* 12. Status */}
              {isColVisible("status") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Status
                </th>
              )}

              {/* 13. Actions */}
              {isColVisible("actions") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
            {loading ? (
              <tr>
                <td
                  colSpan={totalColCount}
                  className="py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#E8C16D] border-r-transparent" />
                  <p className="mt-2 text-xs font-medium">Loading purchase challans...</p>
                </td>
              </tr>
            ) : paginatedChallans.length === 0 ? (
              <tr>
                <td colSpan={totalColCount} className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    <FileSpreadsheet className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                    No Purchase Challans Found
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No challans match the selected filters or date range.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedChallans.map((ch, idx) => {
                const isSelected = selectedIds.includes(ch.id);
                const isPending =
                  ch.invoiceStatus === "Pending" ||
                  ch.invoiceStatus === "Not Invoiced" ||
                  !ch.invoiceStatus;

                return (
                  <tr
                    key={ch.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/[0.06] dark:hover:bg-white/[0.03] ${
                      isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    {/* 1. No. */}
                    {isColVisible("no") && (
                      <td className="px-3.5 py-3 text-center text-slate-500 dark:text-slate-400 font-semibold">
                        {(page - 1) * limit + idx + 1}
                      </td>
                    )}

                    {/* 2. Checkbox */}
                    {isColVisible("checkbox") && (
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(ch.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                          style={{ accentColor: "#0A0E1A" }}
                        />
                      </td>
                    )}

                    {/* 3. Challan No. */}
                    {isColVisible("challanNo") && (
                      <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-bold border border-slate-200 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border-white/[0.1]">
                          {ch.challanNo}
                        </span>
                      </td>
                    )}

                    {/* 4. Lot No. & Product SKU (Single display: Lot or SKU) */}
                    {isColVisible("lotSku") && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const display = getLotOrSkuDisplay(ch);
                          return (
                            <span
                              title={display.title || display.text}
                              className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs"
                            >
                              {display.text}
                            </span>
                          );
                        })()}
                      </td>
                    )}

                    {/* 5. Date. */}
                    {isColVisible("date") && (
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(ch.challanDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    )}

                    {/* 6. Party. */}
                    {isColVisible("party") && (
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {ch.supplierName}
                        </div>
                        {ch.supplier?.city && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {ch.supplier.city}, {ch.supplier.state}
                          </div>
                        )}
                      </td>
                    )}

                    {/* 7. Contact No. */}
                    {isColVisible("contact") && (
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {ch.contactNo || (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    )}

                    {/* 8. Party Challan No. */}
                    {isColVisible("partyChallanNo") && (
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                        {(() => {
                          const partyNo = getPartyChallanDisplay(ch);
                          return partyNo ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {partyNo}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          );
                        })()}
                      </td>
                    )}

                    {/* 9. Total Qty. */}
                    {isColVisible("totalQty") && (
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                          {ch.totalReceivedQty}
                        </span>
                      </td>
                    )}

                    {/* 10. Challan For. */}
                    {isColVisible("challanFor") && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/[0.05] dark:text-slate-300">
                          {ch.challanFor}
                        </span>
                      </td>
                    )}

                    {/* 11. Prepared By. */}
                    {isColVisible("preparedBy") && (
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {ch.preparedBy || (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    )}

                    {/* 12. Status */}
                    {isColVisible("status") && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </span>
                        )}
                      </td>
                    )}

                    {/* 13. Actions */}
                    {isColVisible("actions") && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(ch)}
                              title="View Challan Details"
                              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(ch)}
                            title="Edit Challan"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {onPrint && (
                            <button
                              type="button"
                              onClick={() => onPrint(ch)}
                              title="Print Challan"
                              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                `/dashboard/purchase/finish-goods/invoice?challanId=${ch.id}`
                              );
                            }}
                            title="Generate / View Purchase Invoice"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                          >
                            <ReceiptText className="h-4 w-4" />
                          </button>
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(ch)}
                              title="Delete Challan"
                              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all cursor-pointer"
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
          </tbody>

          {/* Table Summary Footer matching Image 2 */}
          {!loading && paginatedChallans.length > 0 && showAggregations !== false && (
            <tfoot className="border-t-2 border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/80 dark:bg-[#080B11]/90 font-bold text-xs select-none">
              <tr>
                {prefixSpan > 0 && (
                  <td
                    colSpan={prefixSpan}
                    className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider"
                  >
                    Sum.
                  </td>
                )}
                {isColVisible("totalQty") && (
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-[#E8C16D] font-mono text-xs">
                    {calculatedSum.toFixed(2)}
                  </td>
                )}
                {suffixSpan > 0 && <td colSpan={suffixSpan} className="px-4 py-3" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
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

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  FileSpreadsheet,
  ReceiptText,
  Printer,
} from "lucide-react";
import { SalesChallan } from "../types/challan.types";
import Pagination from "@/components/ui/Pagination";

interface ChallanTableProps {
  challans: SalesChallan[];
  loading: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onEdit: (challan: SalesChallan) => void;
  onDelete?: (challan: SalesChallan) => void;
  onView?: (challan: SalesChallan) => void;
  onPrint?: (challan: SalesChallan) => void;
  onGenerateInvoice?: (challan: SalesChallan) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof SalesChallan;
  sortAsc?: boolean;
  onSortChange?: (field: keyof SalesChallan, asc: boolean) => void;
}

export default function ChallanTable({
  challans,
  loading,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onPrint,
  onGenerateInvoice,
  tableContainerRef,
  visibleColumns,
  sortField: controlledSortField,
  sortAsc: controlledSortAsc,
  onSortChange,
}: ChallanTableProps) {
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

  const isColVisible = (key: string) => {
    if (!visibleColumns) return true;
    return visibleColumns[key] !== false;
  };

  const visibleColCount = useMemo(() => {
    const allKeys = [
      "no",
      "checkbox",
      "date",
      "challanNo",
      "party",
      "contact",
      "quantity",
      "challanFor",
      "salesFor",
      "preparedBy",
      "status",
      "actions",
    ];
    return allKeys.filter(isColVisible).length;
  }, [visibleColumns]);

  const [internalSortField, setInternalSortField] =
    useState<keyof SalesChallan>("createdAt");
  const [internalSortAsc, setInternalSortAsc] = useState<boolean>(false);

  const activeSortField =
    controlledSortField !== undefined ? controlledSortField : internalSortField;
  const activeSortAsc =
    controlledSortAsc !== undefined ? controlledSortAsc : internalSortAsc;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, limit, resolvedRef]);

  const handleSort = (field: keyof SalesChallan) => {
    if (onSortChange) {
      if (activeSortField === field) {
        onSortChange(field, !activeSortAsc);
      } else {
        onSortChange(field, true);
      }
    } else {
      if (internalSortField === field) {
        setInternalSortAsc(!internalSortAsc);
      } else {
        setInternalSortField(field);
        setInternalSortAsc(true);
      }
    }
  };

  const sortedChallans = useMemo(() => {
    return [...challans].sort((a, b) => {
      let aVal = a[activeSortField] ?? "";
      let bVal = b[activeSortField] ?? "";

      if (typeof aVal === "string") {
        return activeSortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return activeSortAsc ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });
  }, [challans, activeSortField, activeSortAsc]);

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

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div
        ref={resolvedRef}
        className="w-full overflow-x-auto min-h-0 overflow-y-auto custom-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[1100px] border-collapse text-left font-sans">
          {/* Header styled with exact order matching Image 2 */}
          <thead className="lg:sticky lg:top-0 z-10 bg-[#FEFAEE] dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] select-none shadow-xs">
            <tr>
              {/* 1. NO. */}
              {isColVisible("no") && (
                <th className="px-3 sm:px-4 py-3.5 text-center w-12 text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  No.
                </th>
              )}

              {/* 2. Checkbox */}
              {isColVisible("checkbox") && (
                <th className="px-3 sm:px-4 py-3.5 text-center w-12">
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

              {/* 3. DATE */}
              {isColVisible("date") && (
                <th
                  onClick={() => handleSort("challanDate")}
                  className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        activeSortField === "challanDate"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 4. CHALLAN NO */}
              {isColVisible("challanNo") && (
                <th
                  onClick={() => handleSort("challanNo")}
                  className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Challan No</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        activeSortField === "challanNo"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 5. PARTY / REF */}
              {isColVisible("party") && (
                <th
                  onClick={() => handleSort("partyName")}
                  className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Party / Ref</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        activeSortField === "partyName"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 6. CONTACT */}
              {isColVisible("contact") && (
                <th className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Contact
                </th>
              )}

              {/* 7. QUANTITY */}
              {isColVisible("quantity") && (
                <th
                  onClick={() => handleSort("totalQuantity")}
                  className="px-3 sm:px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] cursor-pointer hover:text-black dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Quantity</span>
                    <ArrowUpDown
                      className={`h-3 w-3 ${
                        activeSortField === "totalQuantity"
                          ? "opacity-100 text-[#F5C451]"
                          : "opacity-40"
                      }`}
                    />
                  </div>
                </th>
              )}

              {/* 8. CHALLAN FOR (CATEGORY) */}
              {isColVisible("challanFor") && (
                <th className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Challan For
                </th>
              )}

              {/* 9. SALES FOR */}
              {isColVisible("salesFor") && (
                <th className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Sales For
                </th>
              )}

              {/* 10. PREPARED BY */}
              {isColVisible("preparedBy") && (
                <th className="px-3 sm:px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Prepared By
                </th>
              )}

              {/* 12. STATUS */}
              {isColVisible("status") && (
                <th className="px-3 sm:px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Status
                </th>
              )}

              {/* 13. ACTIONS */}
              {isColVisible("actions") && (
                <th className="px-3 sm:px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Loading Sales Challans...
                    </span>
                  </div>
                </td>
              </tr>
            ) : paginatedChallans.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    <FileSpreadsheet className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                    No Sales Challans Found
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
                const rowNo = (page - 1) * limit + idx + 1;
                const refDisplay = ch.refParty || ch.challanRefNo;

                return (
                  <tr
                    key={ch.id}
                    className={`transition-colors ${isSelected
                        ? "bg-[#FFF9EC]/70 dark:bg-[#1A160E]/70 hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E]"
                        : "hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                      }`}
                  >
                    {/* 1. NO. */}
                    {isColVisible("no") && (
                      <td className="px-3 sm:px-4 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 w-12">
                        {rowNo}
                      </td>
                    )}

                    {/* 2. Checkbox */}
                    {isColVisible("checkbox") && (
                      <td className="px-3 sm:px-4 py-3.5 text-center w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(ch.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                          style={{ accentColor: "#0A0E1A" }}
                        />
                      </td>
                    )}

                    {/* 3. DATE */}
                    {isColVisible("date") && (
                      <td className="px-3 sm:px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(ch.challanDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    )}

                    {/* 4. CHALLAN NO */}
                    {isColVisible("challanNo") && (
                      <td className="px-3 sm:px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[#FFF9EC] text-[#0A0E1A] font-bold border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] dark:border-[#E8C16D]/30 text-xs">
                          {ch.challanNo}
                        </span>
                      </td>
                    )}

                    {/* 5. PARTY / REF */}
                    {isColVisible("party") && (
                      <td className="px-3 sm:px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {ch.partyName}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          REF. - {refDisplay ? String(refDisplay).toUpperCase() : "-"}
                        </div>
                        {ch.party?.city && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {ch.party.city}, {ch.party.state}
                          </div>
                        )}
                      </td>
                    )}

                    {/* 6. CONTACT */}
                    {isColVisible("contact") && (
                      <td className="px-3 sm:px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ch.contactNo || (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    )}

                    {/* 7. QUANTITY */}
                    {isColVisible("quantity") && (
                      <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                          {ch.totalQuantity}
                        </span>
                      </td>
                    )}

                    {/* 8. CHALLAN FOR (CATEGORY) */}
                    {isColVisible("challanFor") && (
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.08]">
                          {ch.challanFor || "Sales"}
                        </span>
                      </td>
                    )}

                    {/* 9. SALES FOR */}
                    {isColVisible("salesFor") && (
                      <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.08]">
                          {ch.salesFor || "Product"}
                        </span>
                      </td>
                    )}

                    {/* 10. PREPARED BY */}
                    {isColVisible("preparedBy") && (
                      <td className="px-3 sm:px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ch.preparedBy || (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    )}

                    {/* 12. STATUS */}
                    {isColVisible("status") && (
                      <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isPending
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPending ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          {isPending ? "Pending" : "Invoiced"}
                        </span>
                      </td>
                    )}

                    {/* 13. ACTIONS */}
                    {isColVisible("actions") && (
                      <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(ch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="View Challan"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(ch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#E8C16D] hover:bg-[#E8C16D]/10 transition-colors cursor-pointer"
                            title="Edit Challan"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {onGenerateInvoice && (
                            <button
                              type="button"
                              onClick={() => onGenerateInvoice(ch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Generate Invoice"
                            >
                              <ReceiptText className="h-4 w-4" />
                            </button>
                          )}
                          {onPrint && (
                            <button
                              type="button"
                              onClick={() => onPrint(ch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#E8C16D] hover:bg-[#E8C16D]/10 transition-colors cursor-pointer"
                              title="Print Challan"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(ch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Challan"
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
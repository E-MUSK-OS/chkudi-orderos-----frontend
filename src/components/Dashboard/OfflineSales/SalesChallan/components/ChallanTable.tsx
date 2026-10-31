"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Eye, ArrowUpDown, FileSpreadsheet, CheckCircle2, Clock, ReceiptText } from "lucide-react";
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
  onGenerateInvoice?: (challan: SalesChallan) => void;
}

export default function ChallanTable({
  challans,
  loading,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onGenerateInvoice,
}: ChallanTableProps) {
  const router = useRouter();
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  const updateSelectedIds = (newIds: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  };
  const [sortField, setSortField] = useState<keyof SalesChallan>("createdAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleSort = (field: keyof SalesChallan) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedChallans = useMemo(() => {
    return [...challans].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";

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

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          {/* Header styled with SaaS Dark Obsidian & Gold palette */}
          <thead className="border-b border-[#E7E0D2] bg-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#080B11] select-none">
            <tr>
              <th className="px-4 py-3.5 text-center w-12">
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

              <th
                onClick={() => handleSort("challanNo")}
                className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Challan No</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "challanNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("partyName")}
                className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Party Name</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "partyName" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("challanRefNo")}
                className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ref No</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "challanRefNo" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th
                onClick={() => handleSort("challanDate")}
                className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "challanDate" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Contact
              </th>

              <th
                onClick={() => handleSort("totalQuantity")}
                className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Quantity</span>
                  <ArrowUpDown className={`h-3 w-3 ${sortField === "totalQuantity" ? "opacity-100 text-[#F5C451]" : "opacity-40"}`} />
                </div>
              </th>

              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Prepared By
              </th>

              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Category
              </th>

              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Stock Out
              </th>

              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Status
              </th>

              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D]">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#E8C16D] border-r-transparent" />
                  <p className="mt-2 text-xs font-medium">Loading sales challans...</p>
                </td>
              </tr>
            ) : paginatedChallans.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-14 text-center">
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
              paginatedChallans.map((ch) => {
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
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(ch.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  style={{ accentColor: "#0A0E1A" }}
                      />
                    </td>

                    {/* Challan No Badge */}
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-bold border border-slate-200 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border-white/[0.1]">
                        {ch.challanNo}
                      </span>
                    </td>

                    {/* Party Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ch.partyName}
                      </div>
                      {ch.party?.city && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {ch.party.city}, {ch.party.state}
                        </div>
                      )}
                    </td>

                    {/* Ref No */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {ch.challanRefNo || <span className="text-slate-300 dark:text-slate-600">-</span>}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(ch.challanDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {ch.contactNo || <span className="text-slate-300 dark:text-slate-600">-</span>}
                    </td>

                    {/* Quantity Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                        {ch.totalQuantity}
                      </span>
                    </td>

                    {/* Prepared By */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {ch.preparedBy || <span className="text-slate-300 dark:text-slate-600">-</span>}
                    </td>

                    {/* Challan For */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/[0.05] dark:text-slate-300">
                        {ch.challanFor}
                      </span>
                    </td>

                    {/* Stock Out */}
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {ch.stockOutFrom}
                    </td>

                    {/* Invoice Status Pill */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                          <CheckCircle2 className="h-3 w-3" />
                          Invoiced
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(ch)}
                            title="View Challan Details"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] transition-all dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06] cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(ch)}
                          title="Edit Challan"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] transition-all dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06] cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onGenerateInvoice) {
                              onGenerateInvoice(ch);
                            } else {
                              router.push(`/dashboard/offline-sales/sales-invoice?challanId=${ch.id}`);
                            }
                          }}
                          title="Generate / View Sales Invoice"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-[#B88728] hover:text-[#9A701E] hover:bg-[#FFF9EC] transition-all dark:text-[#F5C451] dark:hover:text-[#F5C451] dark:hover:bg-amber-500/10 cursor-pointer"
                        >
                          <ReceiptText className="h-4 w-4" />
                        </button>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(ch)}
                            title="Delete Challan"
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
          onLimitChange={setLimit}
          onPageSizeChange={setLimit}
        />
      )}
    </div>
  );
}

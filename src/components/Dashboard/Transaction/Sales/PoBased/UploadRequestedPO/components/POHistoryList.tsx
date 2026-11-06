"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RequestedPO } from "../types/requestedPo.types";
import { requestedPoService } from "../services/requestedPo.service";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface POHistoryListProps {
  storeId: string;
  storeName: string;
  poList: RequestedPO[];
  onRefresh: () => void;
  onViewPO?: (po: RequestedPO) => void;
  viewingPoId?: string | null;
}

export default function POHistoryList({
  storeName,
  poList,
  onRefresh,
  onViewPO,
  viewingPoId,
}: POHistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (poList.length === 0) {
    return null;
  }

  const handleDelete = async (e: React.MouseEvent, poId: string, poNum: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Are you sure you want to delete PO #${poNum}?`)) {
      try {
        await requestedPoService.delete(poId);
        toast.success(`PO #${poNum} deleted.`);
        onRefresh();
      } catch (err: unknown) {
        console.error("Delete PO failed:", err);
        toast.error("Failed to delete purchase order.");
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(poList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedList = poList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      {/* Card Header matching OrderOS style */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#E7E0D2] dark:border-white/[0.06] bg-white dark:bg-[#0F1626] cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
              Uploaded Purchase Orders for {storeName} ({poList.length})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage and view previous requested PO batches
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] text-slate-500 hover:text-[#B88728] dark:hover:text-[#F5C451] transition shadow-2xs"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-white/[0.03] text-[#6A4D1D] dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Items</th>
                  <th className="px-4 py-3.5 text-center">Total Units</th>
                  <th className="px-4 py-3.5 text-right">Total Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
                {paginatedList.map((po) => {
                  const isCurrentlyViewing = viewingPoId === po.id;
                  return (
                    <tr
                      key={po.id}
                      className={cn(
                        "transition-colors",
                        isCurrentlyViewing
                          ? "bg-[#FFF9EC]/70 dark:bg-amber-500/[0.08]"
                          : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                      )}
                    >
                      {/* PO Number Badge */}
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-bold border border-slate-200 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border-white/[0.1]">
                          {po.poNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        {po.poDate}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700 dark:text-slate-300">
                        {po.itemsCount}
                      </td>

                      {/* Quantity Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                          {po.totalQuantity}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {po.totalAmount > 0
                          ? `₹${po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>

                      {/* Status Pill */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {po.status || "Uploaded"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/dashboard/transaction/sales/po-based/upload-requested-po/view/${encodeURIComponent(po.id)}`}
                            title="View PO Line Items in New Page"
                            onClick={(e) => {
                              if (onViewPO) {
                                e.preventDefault();
                                onViewPO(po);
                              }
                            }}
                            className={cn(
                              "inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer",
                              isCurrentlyViewing
                                ? "text-[#B88728] bg-[#FFF9EC] dark:text-[#F5C451] dark:bg-amber-500/10 ring-1 ring-[#E8C16D]"
                                : "text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:text-slate-400 dark:hover:text-[#F5C451] dark:hover:bg-white/[0.06]"
                            )}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, po.id, po.poNumber)}
                            title="Delete PO"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalRecords={poList.length}
            total={poList.length}
            pageSize={pageSize}
            limit={pageSize}
            itemName="records"
            variant="light"
            options={[10, 20, 50, 100]}
            className="border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onLimitChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}

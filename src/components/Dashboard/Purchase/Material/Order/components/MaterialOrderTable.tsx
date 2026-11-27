"use client";

import React from "react";
import { Edit2, Trash2, ClipboardList } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { MaterialPurchaseOrder } from "../types/materialOrder.types";
import { MaterialOrderColumnOption } from "./MaterialOrderFilters";

interface MaterialOrderTableProps {
  orders: MaterialPurchaseOrder[];
  loading: boolean;
  columns: MaterialOrderColumnOption[];
  showSumRow: boolean;
  page: number;
  limit: number;
  total: number;
  sumOrderedQty: number;
  sumReceivedQty: number;
  sumPendingQty: number;
  sumTotalAmount: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onEdit: (order: MaterialPurchaseOrder) => void;
  onDelete: (order: MaterialPurchaseOrder) => void;
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

function getPoDays(ord: MaterialPurchaseOrder): number {
  if (ord.poDays && ord.poDays > 0) return ord.poDays;
  if (!ord.orderDate) return 0;
  const d = new Date(ord.orderDate);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function MaterialOrderTable({
  orders,
  loading,
  columns,
  showSumRow,
  page,
  limit,
  total,
  sumOrderedQty,
  sumReceivedQty,
  sumPendingQty,
  sumTotalAmount,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
}: MaterialOrderTableProps) {
  const isVisible = (id: string) => columns.find((c) => c.id === id)?.visible !== false;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
              {isVisible("no") && <th className="py-3 px-4 w-14">No.</th>}
              {isVisible("date") && <th className="py-3 px-4">Date.</th>}
              {isVisible("orderNo") && <th className="py-3 px-4">Order No.</th>}
              {isVisible("party") && <th className="py-3 px-4">Party.</th>}
              {isVisible("contactNo") && <th className="py-3 px-4">Contact No.</th>}
              {isVisible("orderQty") && <th className="py-3 px-4 text-right">Order Qty.</th>}
              {isVisible("receivedQty") && <th className="py-3 px-4 text-right">Received Qty.</th>}
              {isVisible("pendingQty") && <th className="py-3 px-4 text-right">Pending Qty.</th>}
              {isVisible("totalAmount") && <th className="py-3 px-4 text-right">Total Amount.</th>}
              {isVisible("status") && <th className="py-3 px-4 text-center">Status.</th>}
              {isVisible("poDays") && <th className="py-3 px-4 text-center">PO Days.</th>}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  Loading material purchase orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No data available
                    </p>
                    <p className="text-xs text-slate-400">
                      Click &ldquo;+ Create Order&rdquo; to create a purchase material order.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((ord, idx) => (
                <tr
                  key={ord.id}
                  className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02] transition-colors"
                >
                  {isVisible("no") && (
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {(page - 1) * limit + idx + 1}
                    </td>
                  )}
                  {isVisible("date") && (
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                      {formatDate(ord.orderDate)}
                    </td>
                  )}
                  {isVisible("orderNo") && (
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                        {ord.orderNo}
                      </span>
                    </td>
                  )}
                  {isVisible("party") && (
                    <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                      {ord.supplier?.partyName || ord.supplierName || "-"}
                    </td>
                  )}
                  {isVisible("contactNo") && (
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {ord.contactNo || ord.supplier?.phone || "-"}
                    </td>
                  )}
                  {isVisible("orderQty") && (
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#0A0E1A] dark:text-white">
                      {Number(ord.totalOrderedQty || 0).toFixed(2)}
                    </td>
                  )}
                  {isVisible("receivedQty") && (
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {Number(ord.totalReceivedQty || 0).toFixed(2)}
                    </td>
                  )}
                  {isVisible("pendingQty") && (
                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                      {Number(ord.totalPendingQty || 0).toFixed(2)}
                    </td>
                  )}
                  {isVisible("totalAmount") && (
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                      ₹ {Number(ord.totalAmount || 0).toFixed(2)}
                    </td>
                  )}
                  {isVisible("status") && (
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ord.status === "Complete"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : ord.status === "Cancelled"
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {ord.status || "Pending"}
                      </span>
                    </td>
                  )}
                  {isVisible("poDays") && (
                    <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                      {getPoDays(ord)}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(ord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                        title="Edit Order"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(ord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {showSumRow && (
            <tfoot>
              <tr className="bg-[#FFF9EC]/70 dark:bg-[#141A29]/80 border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-white">
                {isVisible("no") && <td className="py-2.5 px-4" />}
                {isVisible("date") && <td className="py-2.5 px-4 text-slate-500">Total. {total}</td>}
                {isVisible("orderNo") && <td className="py-2.5 px-4" />}
                {isVisible("party") && <td className="py-2.5 px-4" />}
                {isVisible("contactNo") && <td className="py-2.5 px-4" />}
                {isVisible("orderQty") && (
                  <td className="py-2.5 px-4 text-right font-mono">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumOrderedQty || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("receivedQty") && (
                  <td className="py-2.5 px-4 text-right font-mono">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumReceivedQty || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("pendingQty") && (
                  <td className="py-2.5 px-4 text-right font-mono">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumPendingQty || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("totalAmount") && (
                  <td className="py-2.5 px-4 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumTotalAmount || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("status") && <td className="py-2.5 px-4" />}
                {isVisible("poDays") && <td className="py-2.5 px-4" />}
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

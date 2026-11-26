"use client";

import React from "react";
import { Edit2, Trash2, ShoppingBag } from "lucide-react";
import { PurchaseOrder } from "../types/purchaseOrder.types";
import { ColumnOption } from "./PurchaseOrderFilters";
import Pagination from "@/components/ui/Pagination";

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  loading: boolean;
  columns: ColumnOption[];
  sumOrderedQty: number;
  sumReceivedQty: number;
  sumPendingQty: number;
  sumTotalAmount: number;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function PurchaseOrderTable({
  orders,
  loading,
  columns,
  sumOrderedQty,
  sumReceivedQty,
  sumPendingQty,
  sumTotalAmount,
  onEdit,
  onDelete,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PurchaseOrderTableProps) {
  const isColVisible = (id: string) => {
    const col = columns.find((c) => c.id === id);
    return col ? col.visible : true;
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "Pending").toLowerCase();
    if (s === "received" || s === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
          Received
        </span>
      );
    }
    if (s === "partial") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
          Partial
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-[#E8C16D] border border-amber-200 dark:border-amber-800/50">
        Pending
      </span>
    );
  };

  const now = Date.now();

  const prefixCols = [
    isColVisible("no"),
    isColVisible("orderNo"),
    isColVisible("lotNoSku"),
    isColVisible("date"),
    isColVisible("party"),
    isColVisible("contactNo"),
  ];
  const prefixSpan = prefixCols.filter(Boolean).length;

  const middleCols = [
    isColVisible("orderQty"),
    isColVisible("receivedQty"),
    isColVisible("pendingQty"),
    isColVisible("totalAmount"),
  ];
  const middleSpan = middleCols.filter(Boolean).length;

  const suffixCols = [
    isColVisible("status"),
    isColVisible("poDays"),
    true, // Actions column
  ];
  const suffixSpan = suffixCols.filter(Boolean).length;

  const totalColCount = prefixSpan + middleSpan + suffixSpan;

  return (
    <div className="flex flex-col min-h-0 max-h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div
        className="w-full overflow-x-auto min-h-0 overflow-y-auto custom-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[1100px] text-left border-collapse">
          {/* Header styled with SaaS Dark Obsidian & Gold palette matching Purchase Challan */}
          <thead className="lg:sticky lg:top-0 z-10 border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] select-none text-[#6A4D1D] dark:text-[#E8C16D] font-bold shadow-xs whitespace-nowrap text-xs">
            <tr>
              {isColVisible("no") && (
                <th className="px-3.5 py-3.5 text-center w-12 font-bold uppercase tracking-wider">
                  No.
                </th>
              )}
              {isColVisible("orderNo") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Order No.
                </th>
              )}
              {isColVisible("lotNoSku") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Lot No. & Product SKU
                </th>
              )}
              {isColVisible("date") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Date.
                </th>
              )}
              {isColVisible("party") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Party.
                </th>
              )}
              {isColVisible("contactNo") && (
                <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">
                  Contact No.
                </th>
              )}
              {isColVisible("orderQty") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Order Qty.
                </th>
              )}
              {isColVisible("receivedQty") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Received Qty.
                </th>
              )}
              {isColVisible("pendingQty") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Pending Qty.
                </th>
              )}
              {isColVisible("totalAmount") && (
                <th className="px-4 py-3.5 text-right font-bold uppercase tracking-wider">
                  Total Amount.
                </th>
              )}
              {isColVisible("status") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  Status.
                </th>
              )}
              {isColVisible("poDays") && (
                <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">
                  PO Days.
                </th>
              )}
              <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider w-24">
                Actions
              </th>
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
                  <p className="mt-2 text-xs font-medium">Loading purchase orders...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={totalColCount} className="py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
                    No Purchase Orders Found
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No orders match the selected filters or date range.
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((ord, idx) => {
                const skus = Array.from(
                  new Set(
                    (ord.items || [])
                      .map((it) => it.sku && it.sku.trim())
                      .filter(Boolean)
                  )
                );

                const poDays = ord.orderDate
                  ? Math.max(
                    0,
                    Math.floor(
                      (now - new Date(ord.orderDate).getTime()) / (1000 * 60 * 60 * 24)
                    )
                  )
                  : 0;

                const formattedDate = ord.orderDate
                  ? new Date(ord.orderDate).toLocaleDateString("en-GB")
                  : "-";

                return (
                  <tr
                    key={ord.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                  >
                    {isColVisible("no") && (
                      <td className="px-3.5 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * limit + idx + 1}
                      </td>
                    )}
                    {isColVisible("orderNo") && (
                      <td className="px-4 py-3.5 font-semibold font-mono text-xs text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                        {ord.orderNo}
                      </td>
                    )}
                    {isColVisible("lotNoSku") && (
                      <td className="px-4 py-3.5 text-left">
                        <div className="flex flex-col gap-0.5">
                          {ord.lotNo && (
                            <span className="inline-block w-fit px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                              Lot: {ord.lotNo}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            {skus.length > 0 ? skus.join(", ") : "-"}
                          </span>
                        </div>
                      </td>
                    )}
                    {isColVisible("date") && (
                      <td className="px-4 py-3.5 text-left text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                        {formattedDate}
                      </td>
                    )}
                    {isColVisible("party") && (
                      <td className="px-4 py-3.5 text-left font-semibold text-slate-900 dark:text-white">
                        {ord.supplierName}
                      </td>
                    )}
                    {isColVisible("contactNo") && (
                      <td className="px-4 py-3.5 text-left text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {ord.contactNo || "-"}
                      </td>
                    )}
                    {isColVisible("orderQty") && (
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                        {ord.totalOrderedQty}
                      </td>
                    )}
                    {isColVisible("receivedQty") && (
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.totalReceivedQty}
                      </td>
                    )}
                    {isColVisible("pendingQty") && (
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600 dark:text-[#E8C16D]">
                        {ord.totalPendingQty}
                      </td>
                    )}
                    {isColVisible("totalAmount") && (
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        ₹ {ord.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    )}
                    {isColVisible("status") && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(ord.status)}
                      </td>
                    )}
                    {isColVisible("poDays") && (
                      <td className="px-4 py-3.5 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {poDays} Days
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(ord)}
                          title="Edit Order"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(ord.id)}
                          title="Delete Order"
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer matching Purchase Challan - only shown when there are orders */}
          {!loading && orders.length > 0 && (
            <tfoot className="border-t-2 border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/80 dark:bg-[#080B11]/90 font-bold text-xs select-none">
              <tr>
                {prefixSpan > 0 && (
                  <td
                    colSpan={prefixSpan}
                    className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider"
                  >
                    Sum.
                  </td>
                )}
                {isColVisible("orderQty") && (
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                    {sumOrderedQty.toFixed(2)}
                  </td>
                )}
                {isColVisible("receivedQty") && (
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {sumReceivedQty.toFixed(2)}
                  </td>
                )}
                {isColVisible("pendingQty") && (
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600 dark:text-[#E8C16D]">
                    {sumPendingQty.toFixed(2)}
                  </td>
                )}
                {isColVisible("totalAmount") && (
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹ {sumTotalAmount.toFixed(2)}
                  </td>
                )}
                {suffixSpan > 0 && (
                  <td colSpan={suffixSpan} className="px-4 py-3.5" />
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer matching Purchase Challan */}
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

"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Package,
  Search,
  Trash2,
  DollarSign,
  Boxes,
  FileCheck2,
} from "lucide-react";
import { RequestedPOItem } from "../types/requestedPo.types";

interface POItemsTableProps {
  items: RequestedPOItem[];
  onRemoveItem?: (id: string) => void;
  readOnly?: boolean;
}

export default function POItemsTable({
  items,
  onRemoveItem,
  readOnly = false,
}: POItemsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.sku.toLowerCase().includes(q) ||
      (item.productTitle && item.productTitle.toLowerCase().includes(q)) ||
      (item.hsn && item.hsn.toLowerCase().includes(q))
    );
  });

  const totalQuantity = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalAmount = Math.round(
    items.reduce((acc, it) => acc + (it.totalAmount || 0), 0) * 100
  ) / 100;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-xs">
      {/* Table Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Parsed PO Line Items
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredItems.length} of {items.length} items from the uploaded file
            </p>
          </div>
        </div>

        {/* Totals Metric Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-semibold">
            <Boxes className="h-3.5 w-3.5 text-sky-500" />
            <span>Total Units: {totalQuantity.toLocaleString()}</span>
          </div>
          {totalAmount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-semibold">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <span>Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="my-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or Title..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#080B11] text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-white/[0.08]">
            <tr>
              <th className="px-3 py-2.5 w-14 text-center">#</th>
              <th className="px-3 py-2.5">SKU</th>
              <th className="px-3 py-2.5">Product Title</th>
              <th className="px-3 py-2.5 text-center">Qty</th>
              <th className="px-3 py-2.5 text-right">Unit Price</th>
              <th className="px-3 py-2.5 text-right">Total Amount</th>
              <th className="px-3 py-2.5 text-center">HSN</th>
              {!readOnly && onRemoveItem && (
                <th className="px-3 py-2.5 w-12 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {filteredItems.map((item, idx) => (
              <tr
                key={item.id || idx}
                className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-3 py-2 text-center text-slate-400 font-medium">
                  {item.lineNo || idx + 1}
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-sky-600 dark:text-sky-400">
                  {item.sku}
                </td>
                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                  {item.productTitle || "-"}
                </td>
                <td className="px-3 py-2 text-center font-bold text-slate-900 dark:text-white">
                  {item.quantity}
                </td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                  {item.unitPrice ? `₹${item.unitPrice.toFixed(2)}` : "-"}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                  {item.totalAmount ? `₹${item.totalAmount.toFixed(2)}` : "-"}
                </td>
                <td className="px-3 py-2 text-center text-slate-500 font-mono text-[10px]">
                  {item.hsn || "-"}
                </td>
                {!readOnly && onRemoveItem && (
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer rounded"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

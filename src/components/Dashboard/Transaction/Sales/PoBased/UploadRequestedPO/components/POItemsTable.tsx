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
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm space-y-4">
      {/* Table Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E7E0D2]/70 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
              Parsed PO Line Items
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredItems.length} of {items.length} items from the uploaded file
            </p>
          </div>
        </div>

        {/* Totals Metric Pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] font-bold text-[#0A0E1A] dark:text-slate-200 shadow-2xs">
            <Boxes className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Total Units: {totalQuantity.toLocaleString()}</span>
          </div>
          {totalAmount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or Title..."
            className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <tr>
              <th className="px-3.5 py-3 w-14 text-center">#</th>
              <th className="px-3.5 py-3">SKU</th>
              <th className="px-3.5 py-3">Product Title</th>
              <th className="px-3.5 py-3 text-center">Qty</th>
              <th className="px-3.5 py-3 text-right">Unit Price</th>
              <th className="px-3.5 py-3 text-right">Total Amount</th>
              <th className="px-3.5 py-3 text-center">HSN</th>
              {!readOnly && onRemoveItem && (
                <th className="px-3.5 py-3 w-12 text-center">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.05]">
            {filteredItems.map((item, idx) => (
              <tr
                key={item.id || idx}
                className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-3.5 py-2.5 text-center text-slate-400 font-medium">
                  {item.lineNo || idx + 1}
                </td>
                <td className="px-3.5 py-2.5 font-mono font-bold text-[#B88728] dark:text-[#F5C451]">
                  {item.sku}
                </td>
                <td className="px-3.5 py-2.5 font-semibold text-[#0A0E1A] dark:text-slate-200 max-w-xs truncate">
                  {item.productTitle || "-"}
                </td>
                <td className="px-3.5 py-2.5 text-center font-bold text-[#0A0E1A] dark:text-white">
                  {item.quantity}
                </td>
                <td className="px-3.5 py-2.5 text-right font-medium text-slate-600 dark:text-slate-300">
                  {item.unitPrice ? `₹${item.unitPrice.toFixed(2)}` : "-"}
                </td>
                <td className="px-3.5 py-2.5 text-right font-bold text-[#0A0E1A] dark:text-slate-100">
                  {item.totalAmount ? `₹${item.totalAmount.toFixed(2)}` : "-"}
                </td>
                <td className="px-3.5 py-2.5 text-center text-slate-500 font-mono text-[10px]">
                  {item.hsn || "-"}
                </td>
                {!readOnly && onRemoveItem && (
                  <td className="px-3.5 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer rounded-lg"
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

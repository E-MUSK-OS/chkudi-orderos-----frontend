"use client";

import React, { useState } from "react";
import {
  History,
  FileText,
  Calendar,
  Layers,
  IndianRupee,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RequestedPO } from "../types/requestedPo.types";
import { requestedPoService } from "../services/requestedPo.service";
import { toast } from "sonner";

interface POHistoryListProps {
  storeId: string;
  storeName: string;
  poList: RequestedPO[];
  onRefresh: () => void;
  onViewPO: (po: RequestedPO) => void;
}

export default function POHistoryList({
  storeId,
  storeName,
  poList,
  onRefresh,
  onViewPO,
}: POHistoryListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (poList.length === 0) {
    return null;
  }

  const handleDelete = (e: React.MouseEvent, poId: string, poNum: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete PO #${poNum}?`)) {
      requestedPoService.delete(poId);
      toast.success(`PO #${poNum} deleted.`);
      onRefresh();
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-xs">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              Uploaded Purchase Orders for {storeName} ({poList.length})
            </h4>
          </div>
        </div>

        <button
          type="button"
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100 dark:border-white/[0.08]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-white/[0.08]">
              <tr>
                <th className="px-3 py-2">PO Number</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-center">Items</th>
                <th className="px-3 py-2 text-center">Total Units</th>
                <th className="px-3 py-2 text-right">Total Amount</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {poList.map((po) => (
                <tr
                  key={po.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2 font-mono font-bold text-[#008ECC] dark:text-[#38BDF8]">
                    {po.poNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium">
                    {po.poDate}
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-slate-700 dark:text-slate-300">
                    {po.itemsCount}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-slate-800 dark:text-slate-100">
                    {po.totalQuantity}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                    {po.totalAmount > 0
                      ? `₹${po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {po.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewPO(po)}
                        title="View PO Items"
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, po.id, po.poNumber)}
                        title="Delete PO"
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm space-y-4">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
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
        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-[#E7E0D2] dark:border-white/[0.08]">
              <tr>
                <th className="px-3.5 py-3">PO Number</th>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3 text-center">Items</th>
                <th className="px-3.5 py-3 text-center">Total Units</th>
                <th className="px-3.5 py-3 text-right">Total Amount</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.05]">
              {poList.map((po) => (
                <tr
                  key={po.id}
                  className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3.5 py-2.5 font-mono font-bold text-[#B88728] dark:text-[#F5C451]">
                    {po.poNumber}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                    {po.poDate}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-medium text-slate-700 dark:text-slate-300">
                    {po.itemsCount}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-bold text-[#0A0E1A] dark:text-white">
                    {po.totalQuantity}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-[#0A0E1A] dark:text-slate-100">
                    {po.totalAmount > 0
                      ? `₹${po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
                      {po.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewPO(po)}
                        title="View PO Items"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#B88728] hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] dark:hover:text-[#F5C451] transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, po.id, po.poNumber)}
                        title="Delete PO"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="h-4 w-4" />
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

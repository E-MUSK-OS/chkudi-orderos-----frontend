"use client";

import React from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

interface DeletePOModalProps {
  open: boolean;
  poNumber?: string;
  itemsCount?: number;
  totalQuantity?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePOModal({
  open,
  poNumber,
  itemsCount,
  totalQuantity,
  loading = false,
  onClose,
  onConfirm,
}: DeletePOModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white border border-[#E7E0D2] p-6 shadow-2xl dark:bg-[#0F1626] dark:border-white/[0.1] text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
      >
        {/* Top Close Button */}
        <div className="flex justify-end -mt-1 -mr-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col items-center text-center -mt-2">
          {/* Danger Trash Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20">
            <Trash2 className="h-7 w-7 stroke-[2]" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Delete Purchase Order?
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            Are you sure you want to permanently delete this uploaded purchase order?
          </p>

          {/* PO Number Chip */}
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-900 border border-slate-200 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border-white/[0.08]">
            <span>PO #{poNumber || "Unknown"}</span>
            {itemsCount !== undefined && itemsCount > 0 && (
              <span className="text-slate-400 font-sans font-normal text-[11px]">
                • {itemsCount} Items
              </span>
            )}
            {totalQuantity !== undefined && totalQuantity > 0 && (
              <span className="text-slate-400 font-sans font-normal text-[11px]">
                • {totalQuantity} Units
              </span>
            )}
          </div>

          {/* Warning Banner */}
          <div className="mt-4.5 flex w-full items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-semibold text-amber-900 dark:text-amber-300">
                This action cannot be undone.
              </p>
              <p className="text-amber-700 dark:text-amber-400/90 mt-0.5">
                All parsed line items and scanning progress for this purchase order will be permanently removed.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-[#E7E0D2] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete PO</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Trash2, X, RefreshCw, AlertTriangle } from "lucide-react";

export interface DeleteItemInfo {
  id: string;
  sku: string;
  asin?: string;
  operatorName?: string;
}

interface DeleteAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  items?: DeleteItemInfo[];
  item?: DeleteItemInfo | null;
  count?: number;
}

export default function DeleteAnalyticsModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  items,
  item,
  count,
}: DeleteAnalyticsModalProps) {
  if (!isOpen) return null;

  const effectiveCount = count ?? (items ? items.length : item ? 1 : 0);
  if (effectiveCount === 0) return null;

  const isMultiple = effectiveCount > 1;
  const singleItem = item || (items && items.length === 1 ? items[0] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl sm:rounded-[32px] border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 dark:border-[#E8C16D]/20 shadow-xs">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#E8C16D]">
                {isMultiple ? `Delete ${effectiveCount} Products` : "Delete Product Analytics"}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-300">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6 sm:p-7">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {isMultiple
              ? `Are you sure you want to delete these ${effectiveCount} selected products? All associated ranking, review, and BSR tracking history will be permanently deleted.`
              : "Are you sure you want to delete this SKU? All associated ranking, review, and BSR tracking history will be permanently deleted."}
          </p>

          {/* Details card */}
          {isMultiple ? (
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Selected Count:</span>
                <span className="font-bold text-[#0A0E1A] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 px-2.5 py-0.5 rounded-lg">
                  {effectiveCount} items
                </span>
              </div>
              {items && items.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">SKUs to delete:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {items.slice(0, 10).map((it) => (
                      <span
                        key={it.id}
                        className="inline-flex items-center rounded-lg border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {it.sku}
                      </span>
                    ))}
                    {items.length > 10 && (
                      <span className="inline-flex items-center rounded-lg border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-2 py-0.5 text-[11px] font-bold text-[#B88728] dark:text-[#E8C16D]">
                        +{items.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : singleItem ? (
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Seller SKU:</span>
                <span className="font-bold text-[#0A0E1A] dark:text-white">{singleItem.sku}</span>
              </div>
              {singleItem.asin && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">ASIN:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{singleItem.asin}</span>
                </div>
              )}
              {singleItem.operatorName && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Operator:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{singleItem.operatorName}</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-white/[0.04] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-red-600 text-xs sm:text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm shadow-red-200 dark:shadow-none"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>{isMultiple ? `Delete (${effectiveCount})` : "Delete SKU"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

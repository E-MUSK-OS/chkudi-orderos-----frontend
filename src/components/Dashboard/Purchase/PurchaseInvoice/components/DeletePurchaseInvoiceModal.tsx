"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface DeletePurchaseInvoiceModalProps {
  isOpen: boolean;
  invoiceNo?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePurchaseInvoiceModal({
  isOpen,
  invoiceNo,
  loading = false,
  onClose,
  onConfirm,
}: DeletePurchaseInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#0F1626] rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] shadow-2xl overflow-hidden p-6 text-center space-y-4">
        {/* Icon */}
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <Trash2 className="w-7 h-7" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Delete Purchase Invoice?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Are you sure you want to delete purchase invoice{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              #{invoiceNo}
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Invoice Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[#FFF9EC] px-4 py-2 font-mono text-sm font-bold text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
          <span>#{invoiceNo || "-"}</span>
        </div>

        {/* Warning Box */}
        <div className="flex w-full items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              This action cannot be undone.
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
              This purchase invoice and all related records will be permanently removed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth={false}
            className="rounded-2xl h-10 px-5 text-xs font-semibold active:scale-[0.98]"
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            fullWidth={false}
            className="rounded-2xl h-10 px-5 text-xs font-bold active:scale-[0.98]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? "Deleting..." : "Delete Invoice"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

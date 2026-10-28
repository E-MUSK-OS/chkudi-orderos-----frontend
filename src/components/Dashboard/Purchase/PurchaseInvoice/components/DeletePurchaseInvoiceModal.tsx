"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface DeletePurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceNo?: string;
  loading?: boolean;
}

export default function DeletePurchaseInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceNo,
  loading = false,
}: DeletePurchaseInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 space-y-5 animate-scale-up">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 grid place-items-center">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Delete Purchase Invoice?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete purchase invoice{" "}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              #{invoiceNo || "Selected"}
            </span>
            ? This action will permanently remove the invoice and all of its items. If linked to a purchase challan, the challan status will revert to Pending.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            fullWidth={false}
            className="h-10 px-4 rounded-xl text-xs font-semibold"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            fullWidth={false}
            className="h-10 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm"
            leftIcon={<Trash2 size={15} />}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  invoiceNo: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteInvoiceModal({
  isOpen,
  invoiceNo,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteInvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0F1626] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden p-6 text-center space-y-4">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Delete Sales Invoice?
          </h3>
          <p className="text-xs text-slate-500">
            Are you sure you want to delete invoice{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              #{invoiceNo}
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            fullWidth={false}
            className="rounded-xl px-5 text-xs font-semibold"
          >
            Cancel
          </Button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Deleting..." : "Delete Invoice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteLedgerModalProps {
  open: boolean;
  ledgerName?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteLedgerModal({
  open,
  ledgerName,
  loading,
  onClose,
  onConfirm,
}: DeleteLedgerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E7E0D2] p-6 shadow-2xl text-slate-900 dark:bg-[#0E121A] dark:border-white/[0.1] dark:text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Delete Ledger Account?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900 dark:text-white">"{ledgerName}"</span>? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E0D2] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Delete Ledger</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


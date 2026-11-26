"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteSalesOrderModalProps {
  open: boolean;
  orderNo?: string;
  deleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteSalesOrderModal({
  open,
  orderNo,
  deleting,
  onConfirm,
  onCancel,
}: DeleteSalesOrderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0A0E1A] dark:text-white">
                Delete Sales Order
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete Sales Order{" "}
          <span className="font-bold text-[#0A0E1A] dark:text-white">
            {orderNo || ""}
          </span>
          ?
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface DeleteWebstoreModalProps {
  open: boolean;
  storeName?: string;
  marketplaceName?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteWebstoreModal({
  open,
  storeName,
  marketplaceName,
  loading,
  onClose,
  onConfirm,
}: DeleteWebstoreModalProps) {
  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="secondary"
        fullWidth={false}
        onClick={onClose}
        disabled={loading}
        className="rounded-2xl h-10 px-4 text-xs font-semibold"
      >
        Cancel
      </Button>

      <Button
        variant="danger"
        fullWidth={false}
        onClick={onConfirm}
        disabled={loading}
        className="rounded-2xl h-10 px-5 text-xs font-bold"
      >
        {loading ? "Deleting..." : "Delete Webstore"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      showHeader={false}
      footer={footer}
    >
      <div className="p-6 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <Trash2 className="h-7 w-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Delete Webstore
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Are you sure you want to permanently delete this webstore?
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-mono text-sm font-bold text-slate-900 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border dark:border-white/[0.08]">
            <span>{storeName || "-"}</span>
            {marketplaceName && (
              <span className="text-slate-500 font-sans font-normal text-xs">
                • {marketplaceName}
              </span>
            )}
          </div>

          <div className="mt-5 flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                This action cannot be undone.
              </p>
              <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                This marketplace webstore and all its stored API credentials will be permanently removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

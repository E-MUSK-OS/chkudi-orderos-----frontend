"use client";

import { Trash2, AlertTriangle } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { Warehouse } from "../types/warehouse.types";

interface Props {
  open: boolean;
  warehouse: Warehouse | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteWarehouseModal({
  open,
  warehouse,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="secondary"
        fullWidth={false}
        onClick={onClose}
        disabled={loading}
        className="rounded-2xl active:scale-[0.98]"
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        fullWidth={false}
        onClick={onConfirm}
        disabled={loading}
        className="rounded-2xl active:scale-[0.98]"
      >
        {loading ? "Deleting..." : "Delete Warehouse"}
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
      <div className="p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <Trash2 className="h-8 w-8" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Delete Warehouse
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Are you sure you want to permanently delete
          </p>

          <p className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-base font-semibold text-slate-900 dark:bg-white/[0.06] dark:text-white dark:border dark:border-white/[0.08]">
            {warehouse?.warehouseName}
          </p>

          {/* Warning */}
          <div className="mt-6 flex w-full items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                This action cannot be undone.
              </p>

              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400/90">
                This warehouse and all of its associated information will be
                permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
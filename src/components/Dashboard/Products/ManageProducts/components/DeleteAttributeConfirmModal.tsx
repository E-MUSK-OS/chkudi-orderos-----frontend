"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  attributeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAttributeConfirmModal({
  open,
  attributeName,
  onClose,
  onConfirm,
}: Props) {
  const footer = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
      <Button
        variant="secondary"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        onClick={onClose}
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white border-transparent active:scale-[0.98]"
        onClick={onConfirm}
      >
        Delete Attribute
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      showHeader={false}
      footer={footer}
    >
      <div className="py-4 sm:py-6 px-1 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
          <Trash2 className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Delete Attribute
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Are you sure you want to delete this attribute?
        </p>

        {attributeName && (
          <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] px-3.5 py-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              {attributeName}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3 text-left">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
            This attribute and its values will be removed from this product when you click Update Product.
          </p>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  attributeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAttributeModal({
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
        onClick={onClose}
        className="w-full sm:w-auto min-h-[40px] px-5 rounded-xl font-bold text-xs active:scale-[0.98]"
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        fullWidth={false}
        onClick={onConfirm}
        className="w-full sm:w-auto min-h-[40px] px-5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white border-transparent active:scale-[0.98]"
      >
        Yes, Delete Attribute
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
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-200/60 dark:border-rose-500/20">
            <Trash2 className="h-6 w-6" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Delete Attribute
          </h3>

          {/* Description */}
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this attribute from this product?
          </p>

          {/* Attribute Name Pill */}
          {attributeName && (
            <div className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white">
              Attribute: <span className="text-[#B88728] dark:text-[#F5C451]">{attributeName}</span>
            </div>
          )}

          {/* Warning */}
          <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10 p-3 text-left">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] leading-4 text-amber-800 dark:text-amber-300">
              Any values and variant associations for this attribute will be removed.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}


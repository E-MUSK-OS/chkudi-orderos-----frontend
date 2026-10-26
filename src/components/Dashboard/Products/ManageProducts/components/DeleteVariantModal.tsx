"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { ProductVariant } from "../types/productVariant.types";

interface Props {
  open: boolean;
  variant: ProductVariant | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteVariantModal({
  open,
  variant,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        variant="secondary"
        fullWidth={false}
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        fullWidth={false}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Variant"}
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
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Delete Variant
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Are you sure you want to permanently delete this variant?
          </p>

          <div className="mt-4 rounded-lg bg-slate-100 dark:bg-[#131926] border border-transparent dark:border-white/[0.08] px-5 py-3">
            <p className="font-semibold text-slate-900 dark:text-white">
              {variant?.variantSku}
            </p>
          </div>

          <div className="mt-6 flex w-full items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                This action cannot be undone.
              </p>

              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400/90">
                This variant and its attribute mappings will be permanently
                removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { MaterialVariant } from "../types/materialVariant.types";

interface Props {
  open: boolean;
  variant: MaterialVariant | any;
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
      title="Delete Material Variant"
      description="Are you sure you want to delete this variant? This action cannot be undone."
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Permanent deletion</p>
            <p className="mt-1">
              Deleting this variant will permanently remove its SKU mappings,
              stock configuration, and barcode references.
            </p>
          </div>
        </div>

        {variant && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Variant SKU:{" "}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {variant.variantSku}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

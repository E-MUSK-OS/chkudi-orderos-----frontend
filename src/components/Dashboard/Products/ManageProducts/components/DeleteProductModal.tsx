"use client";

import { Trash2, AlertTriangle } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { Product } from "../types/product.types";
import { useDeleteProduct } from "../hooks/useProducts";

interface Props {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteProductModal({
  open,
  product,
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
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        fullWidth={false}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Product"}
      </Button>
    </div>
  );
  const deleteProductMutation = useDeleteProduct();

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
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Delete Product</h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Are you sure you want to permanently delete
          </p>

          {/* Product Name */}
          <p className="mt-2 rounded-lg bg-slate-100 dark:bg-[#131926] border border-transparent dark:border-white/[0.08] px-4 py-2 text-base font-semibold text-slate-900 dark:text-white">
            {product?.productName}
          </p>

          {/* SKU */}
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            SKU :{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {product?.masterSku}
            </span>
          </p>

          {/* Warning */}
          <div className="mt-6 flex w-full items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                This action cannot be undone.
              </p>

              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400/90">
                This product and all of its associated variants, inventory
                mappings, and related information will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

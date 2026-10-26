"use client";

import { Package } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import ProductForm from "./ProductForm";

import type { Product } from "../types/product.types";
import { useState } from "react";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({
  open,
  mode,
  product,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const footer = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
      <Button
        variant="secondary"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        form="product-form"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        disabled={loading}
      >
        {loading
          ? mode === "create"
            ? "Saving..."
            : "Updating..."
          : mode === "create"
            ? "Save Product"
            : "Update Product"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      showHeader={false}
      footer={footer}
    >
      {/* Header */}
      <div className="-mx-3.5 sm:-mx-6 -mt-3.5 sm:-mt-6 border-b border-[#E7EAF0] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] px-4 sm:px-6 py-3.5 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#0A0E1A] dark:bg-[#131926] text-[#E8C16D] dark:text-[#F5C451]">
            <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>

          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h2>

            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Create a new product for inventory and marketplace management."
                : "Update product information."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        mode={mode}
        product={product}
        onSuccess={onSuccess}
        onLoadingChange={setLoading}
      />
    </Modal>
  );
}

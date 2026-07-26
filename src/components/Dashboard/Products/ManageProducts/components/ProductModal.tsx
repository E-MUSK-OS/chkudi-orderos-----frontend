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
        type="submit"
        form="product-form"
        fullWidth={false}
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
      <div className="border-b border-[#E7EAF0] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A0E1A] text-[#E8C16D]">
            <Package size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0A0E1A]">
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
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

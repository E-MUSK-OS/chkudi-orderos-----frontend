"use client";

import { useState } from "react";
import { Plus, Check, Sparkles, Tag, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { getCategorySuggestedAttributes } from "../constants/product.constants";

interface Props {
  open: boolean;
  onClose: () => void;
  category: string;
  activeAttributeNames: string[];
  onSelectAttribute: (attributeName: string) => void;
}

const COMMON_EXTRA_ATTRIBUTES = [
  "Material",
  "Fabric",
  "Fit",
  "Pattern",
  "Style",
  "Sleeve",
  "Neckline",
  "Closure",
  "Waist Rise",
  "Storage",
  "RAM",
  "Weight",
  "Volume",
  "Warranty",
];

export default function AddAttributeModal({
  open,
  onClose,
  category,
  activeAttributeNames,
  onSelectAttribute,
}: Props) {
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");

  const suggested = getCategorySuggestedAttributes(category);

  // Normalize active names for case-insensitive comparison
  const normalizedActive = new Set(
    activeAttributeNames.map((n) => n.trim().toLowerCase())
  );

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter an attribute name.");
      return;
    }
    if (normalizedActive.has(trimmed.toLowerCase())) {
      setError(`Attribute "${trimmed}" is already active.`);
      return;
    }
    setError("");
    setCustomName("");
    onSelectAttribute(trimmed);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd(customName);
  };

  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button
        variant="secondary"
        fullWidth={false}
        className="px-5 rounded-2xl text-xs sm:text-sm font-bold"
        onClick={() => {
          setError("");
          setCustomName("");
          onClose();
        }}
      >
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        setError("");
        setCustomName("");
        onClose();
      }}
      size="md"
      title="Add Product Attribute"
      description={`Choose a suggested attribute for ${category || "this product"} or create a custom one.`}
      footer={footer}
    >
      <div className="space-y-5 py-2">
        {/* Category Suggested Attributes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-4 h-4 text-[#B88728] dark:text-[#F5C451]" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Suggested for {category || "Product"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggested.map((attr) => {
              const isAdded = normalizedActive.has(attr.toLowerCase());
              return (
                <button
                  key={attr}
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAdd(attr)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isAdded
                      ? "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/[0.05] cursor-not-allowed"
                      : "bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 border border-slate-200 hover:border-[#E8C16D] dark:border-white/[0.08] dark:hover:border-[#F5C451] hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/10 active:scale-95 cursor-pointer shadow-2xs"
                  }`}
                >
                  {isAdded ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#B88728] dark:text-[#F5C451]" />
                  )}
                  <span>{attr}</span>
                  {isAdded && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      (Added)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Common Attributes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Other Common Attributes
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMMON_EXTRA_ATTRIBUTES.filter(
              (attr) =>
                !suggested.some(
                  (s) => s.toLowerCase() === attr.toLowerCase()
                )
            ).map((attr) => {
              const isAdded = normalizedActive.has(attr.toLowerCase());
              return (
                <button
                  key={attr}
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAdd(attr)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isAdded
                      ? "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/[0.05] cursor-not-allowed"
                      : "bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 border border-slate-200 hover:border-[#E8C16D] dark:border-white/[0.08] dark:hover:border-[#F5C451] hover:bg-slate-50 dark:hover:bg-white/[0.04] active:scale-95 cursor-pointer"
                  }`}
                >
                  {isAdded ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{attr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Attribute Input */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Custom Attribute
          </span>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Sleeve Type, Pocket Style, Connectivity..."
              className="flex-1 h-11 px-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 transition-all placeholder:text-slate-400 shadow-xs"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth={false}
              className="h-11 px-5 rounded-xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#D9B25E] text-[#0A0E1A] dark:bg-[#F5C451] dark:hover:bg-[#E5B441] dark:text-[#0A0E1A] active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
          {error && <p className="mt-1.5 text-[11px] text-rose-500 font-medium">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}


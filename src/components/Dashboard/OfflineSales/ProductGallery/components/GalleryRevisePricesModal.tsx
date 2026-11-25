"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  IndianRupee,
  Search,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../../../Products/ManageProducts/types/product.types";
import type { GalleryProductVariant } from "../types/gallery.types";

interface ProductPriceRow {
  productId: string;
  masterSku: string;
  productName: string;
  category: string;
  totalPcs: number;
  currentRr: number;
  currentDr: number;
}

interface GalleryRevisePricesModalProps {
  open: boolean;
  products: Product[];
  initialSelectedProductIds: string[];
  onClose: () => void;
  onSave: (
    items: Array<{ productId: string; retailRate: number; dealerRate: number }>
  ) => Promise<void>;
  saving: boolean;
}

export default function GalleryRevisePricesModal({
  open,
  products,
  initialSelectedProductIds,
  onClose,
  onSave,
  saving,
}: GalleryRevisePricesModalProps) {
  const [search, setSearch] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialSelectedProductIds.length > 0 ? initialSelectedProductIds : []
  );
  const [editedRates, setEditedRates] = useState<
    Record<string, { rr?: string; dr?: string }>
  >({});

  // Quick bulk apply state
  const [bulkRr, setBulkRr] = useState("");
  const [bulkDr, setBulkDr] = useState("");

  // Compute product rows with live total stock
  const rows: ProductPriceRow[] = useMemo(() => {
    return products
      .filter((p) => p.isActive)
      .map((p) => {
        const variants = Array.isArray(p.variants)
          ? (p.variants as GalleryProductVariant[])
          : [];
        const variantStock = variants.reduce((sum, v) => {
          const invSum = (v.inventories || []).reduce(
            (s, inv) => s + Math.max(0, Number(inv.availableStock) || 0),
            0
          );
          return sum + invSum;
        }, 0);
        const totalPcs =
          variants.length > 0 ? variantStock : Number(p.openingStock) || 0;

        return {
          productId: p.id,
          masterSku: p.masterSku || p.productName,
          productName: p.productName,
          category: p.category || "Uncategorized",
          totalPcs,
          currentRr: Number(p.retailRate) || 0,
          currentDr: Number(p.dealerRate) || 0,
        };
      });
  }, [products]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (inStockOnly && r.totalPcs <= 0) return false;
      if (q) {
        const matchSku = r.masterSku.toLowerCase().includes(q);
        const matchName = r.productName.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchCat) return false;
      }
      return true;
    });
  }, [rows, inStockOnly, search]);

  if (!open) return null;

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedIds.includes(r.productId));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredRows.map((r) => r.productId));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([
        ...selectedIds,
        ...filteredRows.map((r) => r.productId),
      ]);
      setSelectedIds(Array.from(merged));
    }
  };

  const handleApplyBulk = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one product first.");
      return;
    }
    if (bulkRr === "" && bulkDr === "") {
      toast.error("Enter a Retail Rate (RR) or Dealer Rate (DR) to apply.");
      return;
    }

    setEditedRates((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        next[id] = {
          rr: bulkRr !== "" ? bulkRr : prev[id]?.rr,
          dr: bulkDr !== "" ? bulkDr : prev[id]?.dr,
        };
      }
      return next;
    });
    toast.success(`Applied price changes to ${selectedIds.length} selected product(s).`);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one product to revise prices.");
      return;
    }

    const payload = selectedIds.map((id) => {
      const base = rows.find((r) => r.productId === id);
      const edited = editedRates[id];
      const rrVal =
        edited?.rr !== undefined && edited.rr !== ""
          ? Number(edited.rr)
          : base?.currentRr ?? 0;
      const drVal =
        edited?.dr !== undefined && edited.dr !== ""
          ? Number(edited.dr)
          : base?.currentDr ?? 0;
      return {
        productId: id,
        retailRate: Math.max(0, Number.isNaN(rrVal) ? 0 : rrVal),
        dealerRate: Math.max(0, Number.isNaN(drVal) ? 0 : drVal),
      };
    });

    await onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-4xl rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                Revise Product Prices (RR & DR)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select products (or filter to In-Stock only) and update Retail Rate & Dealer Rate.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Bulk Apply Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#0B0F17]/60 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, name, category..."
                className="w-full h-9.5 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            {/* In Stock Only Filter Toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly((p) => !p)}
              className={`h-9.5 px-3.5 rounded-xl text-xs font-bold border inline-flex items-center gap-2 transition-all cursor-pointer ${
                inStockOnly
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                  : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  inStockOnly ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span>In Stock Only</span>
            </button>

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              {selectedIds.length} selected / {filteredRows.length} shown
            </span>
          </div>

          {/* Bulk Price Inputs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1">
              Bulk Set for Selected:
            </span>
            <div className="relative w-28">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                RR ₹
              </span>
              <input
                type="number"
                min="0"
                value={bulkRr}
                onChange={(e) => setBulkRr(e.target.value)}
                placeholder="0"
                className="w-full h-9 pl-10 pr-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono font-bold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
            <div className="relative w-28">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                DR ₹
              </span>
              <input
                type="number"
                min="0"
                value={bulkDr}
                onChange={(e) => setBulkDr(e.target.value)}
                placeholder="0"
                className="w-full h-9 pl-10 pr-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono font-bold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={selectedIds.length === 0}
              className="h-9 px-3.5 rounded-xl text-xs font-bold border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#FDF2D1] dark:hover:bg-[#262014] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply to Selected
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200/80 dark:border-white/[0.08] text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                      allVisibleSelected
                        ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                        : "border-slate-300 dark:border-white/20 bg-white dark:bg-[#0F1626]"
                    }`}
                  >
                    {allVisibleSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                </th>
                <th className="py-2.5 px-3">Product / Master SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3 w-32">RR (₹)</th>
                <th className="py-2.5 px-4 w-32">DR (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-400 dark:text-slate-500 font-medium"
                  >
                    {inStockOnly
                      ? "No in-stock products match your search. Toggle 'In Stock Only' off to see 0-pcs products."
                      : "No matching products found."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSelected = selectedIds.includes(row.productId);
                  const edited = editedRates[row.productId];
                  const rrValue =
                    edited?.rr !== undefined ? edited.rr : String(row.currentRr);
                  const drValue =
                    edited?.dr !== undefined ? edited.dr : String(row.currentDr);

                  return (
                    <tr
                      key={row.productId}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-[#FFF9EC]/50 dark:bg-[#F5C451]/5"
                          : "hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelect(row.productId)}
                          className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                              : "border-slate-300 dark:border-white/20 bg-white dark:bg-[#080B11]"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[#0A0E1A] dark:text-white">
                          {row.masterSku}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                          {row.productName}
                        </p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.totalPcs > 0
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                          }`}
                        >
                          {row.totalPcs} pcs
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={rrValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!isSelected) {
                              setSelectedIds((prev) => [...prev, row.productId]);
                            }
                            setEditedRates((prev) => ({
                              ...prev,
                              [row.productId]: { ...prev[row.productId], rr: val },
                            }));
                          }}
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono font-bold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          min="0"
                          value={drValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!isSelected) {
                              setSelectedIds((prev) => [...prev, row.productId]);
                            }
                            setEditedRates((prev) => ({
                              ...prev,
                              [row.productId]: { ...prev[row.productId], dr: val },
                            }));
                          }}
                          className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono font-bold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B0F17]/50">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Saving updates Retail Rate & Dealer Rate for{" "}
            <strong className="text-[#0A0E1A] dark:text-white">
              {selectedIds.length}
            </strong>{" "}
            selected product(s).
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || selectedIds.length === 0}
              onClick={handleSubmit}
              className="h-9.5 px-5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Save Revised Prices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

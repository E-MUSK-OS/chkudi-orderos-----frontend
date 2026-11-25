"use client";

import React, { useState } from "react";
import { X, ImageIcon, FileText, Loader2, CheckCircle2 } from "lucide-react";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import type { GalleryColorCardItem } from "../types/gallery.types";

export type ReviseRateTarget = "DR" | "RR" | "BOTH";

interface GallerySelectedProductsSidebarProps {
  selectedCards: GalleryColorCardItem[];
  revisedPriceInputs: Record<string, string>;
  rateTarget: ReviseRateTarget;
  onChangeRateTarget: (target: ReviseRateTarget) => void;
  onChangeRevisedPrice: (productId: string, val: string) => void;
  onRemoveSelectedCard: (card: GalleryColorCardItem) => void;
  onClearAll: () => void;
  onCloseMode: () => void;
  onUpdatePrices: () => Promise<void>;
  onExportPdf: () => void;
  updating: boolean;
}

export default function GallerySelectedProductsSidebar({
  selectedCards,
  revisedPriceInputs,
  rateTarget,
  onChangeRateTarget,
  onChangeRevisedPrice,
  onRemoveSelectedCard,
  onClearAll,
  onCloseMode,
  onUpdatePrices,
  onExportPdf,
  updating,
}: GallerySelectedProductsSidebarProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      {/* Header matching img-2 */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white leading-tight">
            Selected Products
          </h2>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {selectedCards.length} selected
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedCards.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMode}
            title="Exit selection mode"
            className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Selected Product Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-[260px]">
        {selectedCards.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center gap-2 text-slate-400 dark:text-slate-500 px-4">
            <CheckCircle2 className="h-7 w-7 opacity-40" />
            <p className="text-xs font-semibold">No products selected</p>
            <p className="text-[11px] opacity-80">
              Click on product cards to select them for price revision or PDF export.
            </p>
          </div>
        ) : (
          selectedCards.map((card) => {
            const currentBaseRate =
              rateTarget === "RR" ? card.retailRate : card.dealerRate;
            const inputVal =
              revisedPriceInputs[card.productId] !== undefined
                ? revisedPriceInputs[card.productId]
                : String(currentBaseRate || "");

            return (
              <div
                key={card.cardId}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0B0F17] p-2"
              >
                {/* Thumbnail */}
                <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 dark:border-white/[0.06] shrink-0 overflow-hidden flex items-center justify-center">
                  {card.imageUrl && !imgErrors[card.cardId] ? (
                    <img
                      src={card.imageUrl}
                      alt={card.cardSku}
                      onError={() =>
                        setImgErrors((p) => ({ ...p, [card.cardId]: true }))
                      }
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    <ImageIcon size={14} className="text-slate-300" />
                  )}
                </div>

                {/* SKU & Current Rate */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0A0E1A] dark:text-white truncate">
                    {card.cardSku}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    RR ₹{card.retailRate} • DR ₹{card.dealerRate}
                  </p>
                </div>

                {/* Revised Price Input Box matching img-2 */}
                <div className="relative w-20 shrink-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={inputVal}
                    onChange={(e) =>
                      onChangeRevisedPrice(card.productId, e.target.value)
                    }
                    placeholder="0"
                    className="w-full h-8 pl-5 pr-2 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#131926] text-xs font-mono font-bold text-right text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveSelectedCard(card)}
                  className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                  title="Remove from selection"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Bar matching img-2: [Revised Prices v] [Update] [PDF] */}
      <div className="p-3 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0B0F17]/60 flex items-center gap-2">
        <ThemeSelectDropdown
          value={rateTarget}
          onChange={(val) => onChangeRateTarget(val as ReviseRateTarget)}
          options={[
            { value: "DR", label: "Revised Prices (DR)" },
            { value: "RR", label: "Revised Prices (RR)" },
            { value: "BOTH", label: "Revised Prices (Both)" },
          ]}
          dropDirection="up"
          className="flex-1 min-w-0"
          buttonClassName="w-full h-9 px-2.5 rounded-xl text-[11px] font-bold"
          menuClassName="min-w-[180px]"
        />

        <button
          type="button"
          disabled={updating || selectedCards.length === 0}
          onClick={onUpdatePrices}
          className="h-9 px-3 rounded-xl text-xs font-bold border border-[#E8C16D]/60 bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1 shrink-0 shadow-2xs"
        >
          {updating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : null}
          <span>Update</span>
        </button>

        <button
          type="button"
          disabled={selectedCards.length === 0}
          onClick={onExportPdf}
          title="Export Selected Products PDF"
          className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shrink-0 shadow-2xs"
        >
          <FileText size={13} className="text-[#B88728] dark:text-[#F5C451]" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}

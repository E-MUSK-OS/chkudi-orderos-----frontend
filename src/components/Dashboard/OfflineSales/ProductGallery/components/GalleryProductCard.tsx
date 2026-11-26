"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingCart,
  SlidersHorizontal,
  ImageIcon,
  Minus,
  Plus,
  X,
  Pencil,
  ExternalLink,
  Check,
} from "lucide-react";
import type {
  CartItem,
  GalleryColorCardItem,
  GalleryDisplayOptions,
  GallerySizeVariant,
  PriceMode,
} from "../types/gallery.types";
import { getColorHex } from "../../../Products/ManageProducts/utils/productVariant.utils";

interface GalleryProductCardProps {
  card: GalleryColorCardItem;
  priceMode: PriceMode;
  displayOptions: GalleryDisplayOptions;
  selectionMode?: boolean;
  activeCartItems: CartItem[];
  isSelected?: boolean;
  onToggleSelect?: (card: GalleryColorCardItem) => void;
  onOpenVariantEdit: (variantId: string, color?: string, productId?: string) => void;
  onAddAllToCart: (card: GalleryColorCardItem) => void;
  onUpdateSizeQty: (
    card: GalleryColorCardItem,
    sizeVariant: GallerySizeVariant,
    delta: number
  ) => void;
  onPreviewImage: (card: GalleryColorCardItem) => void;
}

export default function GalleryProductCard({
  card,
  priceMode,
  displayOptions,
  selectionMode = false,
  activeCartItems,
  isSelected = false,
  onToggleSelect,
  onOpenVariantEdit,
  onAddAllToCart,
  onUpdateSizeQty,
  onPreviewImage,
}: GalleryProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sizePopoverOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSizePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [sizePopoverOpen]);

  const activeUnitRate = priceMode === "RR" ? card.retailRate : card.dealerRate;
  const isOutOfStock = card.totalPcs <= 0;
  const isLowReorder =
    displayOptions.showReorderStock &&
    card.reorderLevel > 0 &&
    card.totalPcs <= card.reorderLevel;

  const cartQtyMap = new Map<string, number>();
  let totalInCartForCard = 0;
  for (const ci of activeCartItems) {
    if (card.sizes.some((s) => s.variantId === ci.variantId)) {
      cartQtyMap.set(ci.variantId, ci.quantity);
      totalInCartForCard += ci.quantity;
    }
  }

  return (
    <div
      onClick={() => {
        if (selectionMode && onToggleSelect) {
          onToggleSelect(card);
        }
      }}
      className={`group relative flex flex-col rounded-xl sm:rounded-2xl border p-2 transition-all duration-200 shadow-2xs hover:shadow-md ${
        selectionMode ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-[#0A0E1A] ring-2 ring-[#0A0E1A]/20 dark:border-white dark:ring-white/25 bg-[#FFF9EC]/30 dark:bg-[#161B2B]"
          : "border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] hover:border-[#E8C16D]/80 dark:hover:border-[#F5C451]/40"
      }`}
    >
      {/* Compact Image Frame */}
      <div
        onClick={(e) => {
          if (selectionMode) {
            e.stopPropagation();
            onToggleSelect?.(card);
            return;
          }
          if (card.imageUrl && !imgError) {
            onPreviewImage(card);
          }
        }}
        className={`relative aspect-[4/3.1] w-full rounded-lg sm:rounded-xl bg-white overflow-hidden border border-slate-100 dark:border-white/[0.06] flex items-center justify-center ${
          selectionMode || (card.imageUrl && !imgError) ? "cursor-pointer" : ""
        }`}
      >
        {card.imageUrl && !imgError ? (
          <img
            src={card.imageUrl}
            alt={card.cardSku}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-300 dark:text-slate-400">
            <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[9px] font-semibold text-slate-400">
              No Image
            </span>
          </div>
        )}

        {/* Top-right Circular Selection Checkmark (matching img-2!) */}
        {onToggleSelect && (selectionMode || isSelected) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(card);
            }}
            title={
              isSelected
                ? "Deselect product"
                : "Select product"
            }
            className={`absolute top-1.5 right-1.5 h-6 w-6 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isSelected
                ? "border-[#0A0E1A] bg-white text-[#0A0E1A] dark:border-white dark:bg-[#0F1626] dark:text-white"
                : "border-slate-300 bg-white/90 text-transparent hover:border-[#E8C16D]"
            }`}
          >
            <Check size={13} strokeWidth={3} />
          </button>
        )}

        {/* Color badge bottom-left of image */}
        {card.color && card.color !== "Standard" && (
          <span
            className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-slate-800 border border-slate-200/80 shadow-2xs backdrop-blur-xs"
            title={`Color: ${card.color}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: getColorHex(card.color) }}
            />
            <span className="truncate max-w-[60px]">{card.color}</span>
          </span>
        )}

        {/* Inactive badge if showing inactive SKUs */}
        {!card.isActive && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white shadow-2xs">
            Inactive
          </span>
        )}

        {/* In Cart indicator pill */}
        {!selectionMode && totalInCartForCard > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#E8C16D] text-[#0A0E1A] shadow-2xs">
            {totalInCartForCard}
          </span>
        )}
      </div>

      {/* Compact Card Body */}
      <div className="mt-2 flex-1 flex flex-col justify-between gap-2">
        <div className="space-y-1">
          {/* Clickable SKU -> Edit Product Variant Page */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVariantEdit(card.primaryVariantId, card.color, card.productId);
            }}
            disabled={!card.primaryVariantId && !card.productId}
            title={
              card.primaryVariantId || card.productId
                ? `Click to edit variant & sizes for ${card.cardSku}`
                : "No variant available"
            }
            className={`group/sku w-full flex items-center justify-between gap-1 text-left ${
              card.primaryVariantId || card.productId
                ? "cursor-pointer hover:text-[#B88728] dark:hover:text-[#F5C451]"
                : "cursor-default"
            }`}
          >
            <span className="text-[11px] sm:text-xs font-extrabold text-[#0A0E1A] dark:text-white group-hover/sku:text-[#B88728] dark:group-hover/sku:text-[#F5C451] truncate transition-colors">
              {card.cardSku}
            </span>
            {(card.primaryVariantId || card.productId) && (
              <ExternalLink
                size={10}
                className="shrink-0 opacity-0 group-hover/sku:opacity-100 text-[#B88728] dark:text-[#F5C451] transition-opacity"
              />
            )}
          </button>

          {/* Category / Sub-Category Pill */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/[0.08]">
              {card.subCategory || card.category || "Uncategorized"}
            </span>
            {displayOptions.showReorderStock && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                  isLowReorder
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                    : "bg-slate-50 text-slate-500 border-slate-200/60 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/[0.06]"
                }`}
              >
                RL: {card.reorderLevel}
              </span>
            )}
          </div>

          {/* Pricing (RR, DR, Cost) + Stock Count */}
          <div className="flex items-end justify-between gap-1.5 pt-0.5">
            <div className="space-y-0.5">
              <div
                className={`text-[11px] font-mono leading-none ${
                  priceMode === "RR"
                    ? "font-extrabold text-[#0A0E1A] dark:text-white"
                    : "font-medium text-slate-500 dark:text-slate-400"
                }`}
              >
                <span className="text-[9px] font-sans font-bold uppercase mr-1 opacity-75">
                  RR
                </span>
                ₹{card.retailRate.toLocaleString("en-IN")}
              </div>

              {displayOptions.showDealerRate && (
                <div
                  className={`text-[11px] font-mono leading-none pt-0.5 ${
                    priceMode === "DR"
                      ? "font-extrabold text-[#0A0E1A] dark:text-white"
                      : "font-medium text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className="text-[9px] font-sans font-bold uppercase mr-1 opacity-75">
                    DR
                  </span>
                  ₹{card.dealerRate.toLocaleString("en-IN")}
                </div>
              )}

              {displayOptions.showCost && (
                <div className="text-[11px] font-mono leading-none pt-0.5 font-medium text-amber-700 dark:text-amber-400">
                  <span className="text-[9px] font-sans font-bold uppercase mr-1 opacity-80">
                    COST
                  </span>
                  ₹{card.cost.toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {displayOptions.showStock && (
              <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOutOfStock ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <span
                  className={
                    isOutOfStock
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {card.totalPcs} pcs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions: Add All + Size Selector Trigger */}
        <div
          className="flex items-center gap-1 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              if (!isOutOfStock) {
                onAddAllToCart(card);
              }
            }}
            title={
              isOutOfStock
                ? "Cannot add to cart — 0 pcs in stock"
                : "Add 1 pc of each in-stock size to cart"
            }
            className={`flex-1 h-8 inline-flex items-center justify-center gap-1 px-2 rounded-lg sm:rounded-xl text-[11px] font-bold border transition-all ${
              isOutOfStock
                ? "border-slate-200/80 dark:border-white/[0.06] bg-slate-100/70 dark:bg-white/[0.03] text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
                : "border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#131926] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:border-[#F5C451]/60 dark:hover:bg-[#E8C16D]/10 dark:hover:text-[#F5C451] cursor-pointer active:scale-[0.98]"
            }`}
          >
            <ShoppingCart size={12} />
            <span>Add all</span>
          </button>

          <button
            type="button"
            onClick={() => setSizePopoverOpen((prev) => !prev)}
            title="Select sizes & quantities"
            className={`h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
              sizePopoverOpen
                ? "border-[#E8C16D] bg-[#FFF9EC] text-[#B88728] dark:border-[#F5C451] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                : "border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:border-[#F5C451]/60 dark:hover:text-[#F5C451]"
            }`}
          >
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Size Matrix Popover */}
      {sizePopoverOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 bottom-11 left-1 right-1 sm:min-w-[240px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#12161E] p-2 sm:p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenVariantEdit(card.primaryVariantId)}
                className="text-[11px] sm:text-xs font-extrabold text-[#0A0E1A] dark:text-white hover:text-[#B88728] dark:hover:text-[#F5C451] truncate block cursor-pointer"
              >
                {card.cardSku}
              </button>
              <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                ₹{activeUnitRate.toLocaleString("en-IN")} / unit ({priceMode})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSizePopoverOpen(false)}
              className="p-0.5 sm:p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>

          <div className="pt-2 grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {card.sizes.map((sv) => {
              const inCartQty = cartQtyMap.get(sv.variantId) || 0;
              const noStock = sv.availableStock <= 0;
              const atMaxStock = inCartQty >= sv.availableStock;

              return (
                <div
                  key={sv.variantId}
                  className={`flex flex-col items-center justify-between rounded-lg sm:rounded-xl border p-1 transition-colors ${
                    inCartQty > 0
                      ? "border-[#E8C16D] bg-[#FFF9EC]/70 dark:border-[#F5C451]/60 dark:bg-[#F5C451]/10"
                      : noStock
                        ? "border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#0B0F17]/60 opacity-55"
                        : "border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B0F17]"
                  }`}
                >
                  <div className="flex items-center gap-1 w-full justify-center">
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#0A0E1A] dark:text-white truncate">
                      {sv.size || "Free"}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] sm:text-[10px] font-mono font-bold leading-tight ${
                      noStock
                        ? "text-rose-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {sv.availableStock}
                  </span>

                  <div
                    className={`mt-0.5 w-full flex items-center justify-between gap-0.5 rounded-md border px-1 py-0.5 ${
                      noStock && inCartQty <= 0
                        ? "border-slate-200/60 dark:border-white/[0.06] bg-slate-100/50 dark:bg-[#0B0F17]/40 cursor-not-allowed"
                        : "border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#131926]"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={inCartQty <= 0}
                      onClick={() => onUpdateSizeQty(card, sv, -1)}
                      className="h-4.5 w-4.5 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-[#0A0E1A] dark:text-white min-w-[12px] text-center select-none">
                      {noStock && inCartQty <= 0 ? "–" : inCartQty}
                    </span>
                    <button
                      type="button"
                      disabled={noStock || atMaxStock}
                      onClick={() => onUpdateSizeQty(card, sv, 1)}
                      title={
                        noStock
                          ? "Out of stock"
                          : atMaxStock
                            ? "Reached maximum available stock"
                            : "Add 1 pc"
                      }
                      className="h-4.5 w-4.5 flex items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

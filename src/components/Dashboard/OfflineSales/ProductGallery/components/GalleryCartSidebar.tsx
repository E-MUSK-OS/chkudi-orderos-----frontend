"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Search,
  ScanBarcode,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import type { GalleryCart, PriceMode } from "../types/gallery.types";
import type { Party } from "../../SalesChallan/types/challan.types";

interface GalleryCartSidebarProps {
  carts: GalleryCart[];
  activeCartId: string;
  parties: Party[];
  priceMode?: PriceMode;
  onChangePriceMode?: (mode: PriceMode) => void;
  onSelectCart: (cartId: string) => void;
  onAddCart: () => void;
  onRemoveCart: (cartId: string) => void;
  onSelectParty: (party: Party | null) => void;
  onOpenAddParty?: () => void;
  onScanSku: (sku: string) => boolean;
  onUpdateItemQty: (variantId: string, delta: number) => void;
  onUpdateItemRate: (variantId: string, rate: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onOpenVariantEdit: (variantId: string) => void;
  onCollapse?: () => void;
}

export default function GalleryCartSidebar({
  carts,
  activeCartId,
  parties,
  priceMode = "DR",
  onChangePriceMode,
  onSelectCart,
  onAddCart,
  onRemoveCart,
  onSelectParty,
  onOpenAddParty,
  onScanSku,
  onUpdateItemQty,
  onUpdateItemRate,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenVariantEdit,
  onCollapse,
}: GalleryCartSidebarProps) {
  const [partyOpen, setPartyOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const partyRef = useRef<HTMLDivElement | null>(null);

  const activeCart = carts.find((c) => c.id === activeCartId) || carts[0];

  useEffect(() => {
    if (!partyOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (partyRef.current && !partyRef.current.contains(e.target as Node)) {
        setPartyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [partyOpen]);

  const filteredParties = parties.filter((p) => {
    const q = partySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.partyName?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q)
    );
  });

  const totalPcs = activeCart
    ? activeCart.items.reduce((sum, i) => sum + i.quantity, 0)
    : 0;
  const totalAmount = activeCart
    ? activeCart.items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
    : 0;

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = scanInput.trim();
    if (!trimmed) return;
    const added = onScanSku(trimmed);
    if (added) {
      setScanInput("");
    }
  };

  return (
    <div className="flex flex-col h-full font-sans rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Carts
          </h2>
          {totalPcs > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
              {totalPcs} pcs
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Hide Carts Panel"
              className="h-7 w-7 rounded-lg border border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-[#0A0E1A] dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cart Tabs (img-1 connected tab strip) */}
      <div className="px-3 pt-2 border-b border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-end gap-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50/40 dark:bg-[#0B0F17]/40 shrink-0">
        {carts.map((cart) => {
          const isActive = cart.id === activeCart?.id;
          const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <div
              key={cart.id}
              onClick={() => onSelectCart(cart.id)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-bold cursor-pointer transition-all shrink-0 -mb-px ${
                isActive
                  ? "bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white border-t border-l border-r border-[#E7E0D2] dark:border-white/[0.12] z-10"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04] mb-0.5 rounded-lg"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  itemCount > 0
                    ? "bg-emerald-500"
                    : isActive
                      ? "bg-[#E8C16D] dark:bg-[#F5C451]"
                      : "bg-slate-400"
                }`}
              />
              <span>{cart.name}</span>
              {itemCount > 0 && (
                <span className="text-[10px] font-mono opacity-75">
                  ({itemCount})
                </span>
              )}
              {carts.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCart(cart.id);
                  }}
                  title="Close cart tab"
                  className="ml-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddCart}
          title="Add New Cart Tab"
          className="h-7 w-7 mb-0.5 shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#B88728] dark:text-slate-400 dark:hover:text-[#F5C451] hover:bg-white dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Party (+ Icon + Dropdown) & Scan Row matching img-1 */}
      <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-1.5 shrink-0">
        {/* Add Party Icon Button (+icon opening img-2 modal) */}
        <button
          type="button"
          onClick={() => onOpenAddParty?.()}
          title="Add New Party"
          aria-label="Add Party"
          className="h-8 w-8 shrink-0 rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/70 dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:border-[#F5C451]/60 dark:hover:bg-[#1A160E] dark:hover:text-[#F5C451] flex items-center justify-center transition-all cursor-pointer"
        >
          <UserPlus size={14} />
        </button>

        {/* Party Dropdown */}
        <div className="relative flex-1 min-w-0" ref={partyRef}>
          <button
            type="button"
            onClick={() => setPartyOpen((p) => !p)}
            className={`w-full h-8 px-2.5 flex items-center gap-1.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
              activeCart?.party
                ? "border-[#E8C16D]/70 bg-[#FFF9EC]/60 text-[#0A0E1A] dark:border-[#F5C451]/40 dark:bg-[#1A160E] dark:text-[#F5C451]"
                : "border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/70 dark:bg-[#080B11] text-slate-500 dark:text-slate-400 hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
            }`}
          >
            <span className="truncate flex-1">
              {activeCart?.party?.partyName || "Select party"}
            </span>
            {activeCart?.party ? (
              <span
                role="button"
                title="Clear selected party"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectParty(null);
                }}
                className="text-slate-400 hover:text-rose-500 shrink-0"
              >
                <X size={12} />
              </span>
            ) : (
              <ChevronDown size={13} className="shrink-0 opacity-70" />
            )}
          </button>

          {partyOpen && (
            <div className="absolute z-40 left-0 right-0 mt-1.5 min-w-[230px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl p-1.5">
              <div className="relative mb-1.5">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  placeholder="Search party..."
                  autoFocus
                  className="w-full h-8 pl-7 pr-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                {filteredParties.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-slate-400">
                    No party found
                  </p>
                ) : (
                  filteredParties.map((party) => {
                    const selected = activeCart?.party?.id === party.id;
                    return (
                      <button
                        key={party.id}
                        type="button"
                        onClick={() => {
                          onSelectParty(party);
                          setPartyOpen(false);
                          setPartySearch("");
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          selected
                            ? "bg-[#FFF9EC] text-[#B88728] font-bold dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <p className="truncate font-semibold">{party.partyName}</p>
                        {(party.city || party.phone) && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {[party.city, party.phone].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scan SKU input */}
        <form onSubmit={handleScanSubmit} className="relative w-[86px] sm:w-[92px] shrink-0">
          <ScanBarcode
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="scan..."
            title="Scan or type Variant SKU and press Enter"
            className="w-full h-9 pl-7 pr-2 rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/70 dark:bg-[#080B11] text-xs font-mono font-semibold text-[#0A0E1A] dark:text-white placeholder:font-sans placeholder:text-slate-400 outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20"
          />
        </form>
      </div>

      {/* Cart Items Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar min-h-[150px]">
        {!activeCart || activeCart.items.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center gap-1.5 text-slate-400 dark:text-slate-500">
            <ShoppingCart className="h-6 w-6 opacity-40" />
            <p className="text-xs font-semibold">Cart is empty</p>
          </div>
        ) : (
          activeCart.items.map((item) => {
            const atMax = item.quantity >= item.availableStock;
            return (
              <div
                key={item.variantId}
                className="rounded-xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0B0F17] p-2 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenVariantEdit(item.variantId)}
                      className="text-xs font-bold text-[#0A0E1A] dark:text-white hover:text-[#B88728] dark:hover:text-[#F5C451] truncate block cursor-pointer"
                    >
                      {item.variantSku}
                    </button>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.color}
                      {item.size ? ` • Size: ${item.size}` : ""} • Stock:{" "}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.availableStock}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variantId)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                    title="Remove item"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Qty Stepper */}
                  <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateItemQty(item.variantId, -1)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-[#0A0E1A] dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={atMax}
                      onClick={() => onUpdateItemQty(item.variantId, 1)}
                      title={
                        atMax
                          ? `Max stock available: ${item.availableStock}`
                          : "Increase qty"
                      }
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Rate Input + Line Total */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center w-20">
                      <span className="absolute left-2 text-[10px] font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          onUpdateItemRate(item.variantId, Number(e.target.value) || 0)
                        }
                        className="w-full h-7 pl-4.5 pr-1.5 text-[11px] font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0A0E1A] dark:text-white min-w-[54px] text-right">
                      ₹{(item.quantity * item.rate).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary + Actions */}
      <div className="p-2.5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0B0F17]/60 space-y-2 shrink-0">
        {totalPcs > 0 && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Total ({totalPcs} pcs)
            </span>
            <span className="font-mono font-black text-sm text-[#0A0E1A] dark:text-white">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClearCart}
            disabled={!activeCart || activeCart.items.length === 0}
            className="h-9.5 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-500/40 dark:hover:text-rose-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={onCheckout}
            disabled={!activeCart || activeCart.items.length === 0}
            className="flex-1 h-9.5 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] transition-all shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <span>Checkout</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

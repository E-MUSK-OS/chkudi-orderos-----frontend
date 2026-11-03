"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Store as StoreIcon, Loader2 } from "lucide-react";
import { Webstore } from "@/components/Dashboard/Settings/Webstore/types/webstore.types";
import { MarketplaceLogo } from "@/components/Dashboard/Settings/Webstore/utils/marketplaceLogos";
import { requestedPoService } from "../services/requestedPo.service";

interface StoreCarouselProps {
  stores: Webstore[];
  selectedStore: Webstore | null;
  onSelectStore: (store: Webstore) => void;
  loading: boolean;
  children?: React.ReactNode;
}

export default function StoreCarousel({
  stores,
  selectedStore,
  onSelectStore,
  loading,
  children,
}: StoreCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3 sm:p-5 shadow-sm">
      <div className="relative flex items-center gap-2">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={scrollLeft}
          title="Scroll left"
          className="shrink-0 p-2 border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer select-none"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Store Cards Container */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-stretch gap-3 overflow-x-auto py-1 px-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 w-full text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#B88728] dark:text-[#E8C16D]" />
              <span>Loading webstores...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 w-full text-xs font-semibold text-slate-400">
              <StoreIcon className="h-5 w-5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>No webstores found. Create one in Settings &gt; Webstore first.</span>
            </div>
          ) : (
            stores.map((store) => {
              const isSelected = selectedStore?.id === store.id;
              const lastPoDate =
                requestedPoService.getLatestDateByStoreId(store.id) ||
                (store.lastPaymentDate
                  ? new Date(store.lastPaymentDate).toISOString().split("T")[0]
                  : null);

              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className={`
                    w-36
                    min-w-[140px]
                    max-w-[144px]
                    h-36
                    rounded-2xl
                    p-2.5
                    flex
                    flex-col
                    items-center
                    justify-between
                    cursor-pointer
                    select-none
                    transition-all
                    duration-200
                    active:scale-[0.98]
                    ${
                      isSelected
                        ? "border-2 border-[#E8C16D] bg-gradient-to-b from-[#FFF9EC] to-white dark:from-[#F5C451]/15 dark:to-[#0F1626] shadow-[0_0_20px_rgba(232,193,109,0.25)] ring-2 ring-[#E8C16D]/30"
                        : "border border-slate-200/80 dark:border-white/[0.08] bg-[#FAF8F5]/80 dark:bg-[#080B11] hover:border-[#E8C16D] hover:bg-[#FFFDF5] dark:hover:bg-white/[0.04] hover:shadow-xs"
                    }
                  `}
                >
                  {/* Center Logo */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#0F1626] border border-slate-200/60 dark:border-white/[0.08] p-1 shadow-2xs shrink-0 mt-0.5">
                    <MarketplaceLogo
                      name={store.marketplaceName}
                      logoUrl={store.marketplaceLogo}
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  {/* Store Name */}
                  <div
                    title={store.storeName}
                    className="text-[11px] font-bold text-[#0A0E1A] dark:text-white text-center uppercase line-clamp-2 px-1 leading-tight tracking-tight mt-1"
                  >
                    {store.storeName}
                  </div>

                  {/* Bottom Pill Badge */}
                  <div className="w-full mt-auto pt-1 flex justify-center">
                    <span
                      className={`w-full text-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight truncate shadow-2xs ${
                        lastPoDate
                          ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451]/20 dark:text-[#F5C451] dark:border dark:border-[#F5C451]/30"
                          : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
                      }`}
                    >
                      {lastPoDate ? `Last Date : ${lastPoDate}` : "No Records Found"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={scrollRight}
          title="Scroll right"
          className="shrink-0 p-2 border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer select-none"
        >
          <ChevronRight className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Upload Row / Sub-panel */}
      {children && (
        <div className="mt-4 pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08]">
          {children}
        </div>
      )}
    </div>
  );
}

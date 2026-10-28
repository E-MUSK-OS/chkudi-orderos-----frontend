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
    <div className="relative rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-2.5 sm:p-3 shadow-xs">
      <div className="relative flex items-center">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={scrollLeft}
          title="Scroll left"
          className="shrink-0 p-1.5 text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-lg transition-colors cursor-pointer select-none"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
        </button>

        {/* Scrollable Store Cards Container */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-stretch gap-2.5 overflow-x-auto py-1 px-1.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 w-full text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#0284C7] dark:text-[#38BDF8]" />
              <span>Loading webstores...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 w-full text-xs text-slate-400">
              <StoreIcon className="h-4 w-4" />
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
                    rounded-xl
                    p-2
                    flex
                    flex-col
                    items-center
                    justify-between
                    cursor-pointer
                    select-none
                    transition-all
                    duration-200
                    border border-slate-200 dark:border-white/[0.08]
                    ${
                      isSelected
                        ? "border-t-[3px] border-t-[#F97316] bg-gradient-to-b from-orange-500/[0.08] to-transparent shadow-xs"
                        : "bg-white dark:bg-[#080B11] hover:border-slate-300 dark:hover:border-white/[0.2] hover:shadow-xs"
                    }
                  `}
                >
                  {/* Center Logo */}
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 mt-0.5">
                    <MarketplaceLogo
                      name={store.marketplaceName}
                      logoUrl={store.marketplaceLogo}
                      className="w-11 h-11"
                    />
                  </div>

                  {/* Store Name */}
                  <div
                    title={store.storeName}
                    className="text-[10px] font-bold text-slate-800 dark:text-slate-100 text-center uppercase line-clamp-2 px-1 leading-tight tracking-tight mt-1"
                  >
                    {store.storeName}
                  </div>

                  {/* Bottom Pill Badge matching Screenshot */}
                  <div className="w-full mt-auto pt-1 flex justify-center">
                    <span className="w-full text-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#1E3A8A] text-white tracking-tight shadow-2xs truncate">
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
          className="shrink-0 p-1.5 text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-lg transition-colors cursor-pointer select-none"
        >
          <ChevronRight className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Upload Row / Sub-panel (Screenshot 2) */}
      {children && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {children}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import { Webstore } from "../types/webstore.types";
import { MarketplaceLogo } from "../utils/marketplaceLogos";

interface WebstoreCardProps {
  store: Webstore;
  onModify: (store: Webstore) => void;
  onToggleStatus: (store: Webstore) => void;
  onDelete?: (store: Webstore) => void;
  togglingStatus?: boolean;
}

export default function WebstoreCard({
  store,
  onModify,
  onToggleStatus,
  onDelete,
  togglingStatus = false,
}: WebstoreCardProps) {
  // Format Date of Registration: DD/MM/YYYY
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(store.registrationDate);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (_) {
      return "-";
    }
  }, [store.registrationDate]);

  return (
    <div className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[#E8C16D]/50 transition-all duration-200 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50">
      {/* Top SKU Badge */}
      <div className="flex justify-end">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#1A160E] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs">
          No. of SKU - {store.skuCount ?? 0}
        </span>
      </div>

      {/* Center Marketplace Logo */}
      <div className="flex flex-col items-center justify-center my-3">
        <MarketplaceLogo
          name={store.marketplaceName}
          logoUrl={store.marketplaceLogo}
          className="w-16 h-16"
        />
      </div>

      {/* Store & Company Details */}
      <div className="text-center space-y-1 mb-4">
        {/* Webstore Name */}
        <h3
          title={store.storeName}
          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate px-1"
        >
          {store.storeName}
        </h3>

        {/* Company Name */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Company:
          </span>{" "}
          {store.billTo || "Chakudee Fashion"}
        </p>

        {/* D.O.R. */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            D.O.R.
          </span>{" "}
          {formattedDate}
        </p>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E7E0D2]/60 dark:border-white/[0.06]">
        {/* Active Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={store.isActive}
            disabled={togglingStatus}
            onChange={() => onToggleStatus(store)}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>

        <div className="flex items-center gap-1.5">
          {/* Delete Option */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(store)}
              title="Delete Webstore"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Modify Button in golden theme */}
          <button
            type="button"
            onClick={() => onModify(store)}
            className="px-4 py-1 text-xs font-bold rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-95 text-[#0A0E1A] shadow-xs transition-all cursor-pointer"
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

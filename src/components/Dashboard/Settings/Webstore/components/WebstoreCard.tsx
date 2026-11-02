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
    <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Top SKU Badge matching Screenshot */}
      <div className="flex justify-end">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1E3A8A] text-white dark:bg-[#0369A1] shadow-xs">
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

      {/* Store & Company Details matching Screenshot */}
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

      {/* Bottom Actions Row matching Screenshot */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        {/* Active Toggle Switch matching green toggle in screenshot */}
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
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Modify Button matching second image golden theme */}
          <button
            type="button"
            onClick={() => onModify(store)}
            className="px-3.5 py-1 text-xs font-bold rounded-xl bg-[#F5C451] hover:bg-[#e8b83e] active:scale-95 text-[#0A0E1A] shadow-xs transition-all cursor-pointer dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11]"
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

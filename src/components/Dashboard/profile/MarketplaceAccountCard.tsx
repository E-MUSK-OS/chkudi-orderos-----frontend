"use client";

import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type {
  MarketplaceAccount,
} from "@/services/marketplaceAccount/marketplaceAccount.types";

interface Props {
  account: MarketplaceAccount;

  onEdit: (account: MarketplaceAccount) => void;

  onDelete: (account: MarketplaceAccount) => void;
}

export default function MarketplaceAccountCard({
  account,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#E7E0D2] bg-white p-5 shadow-xs transition-all duration-200 hover:border-[#E8C16D] hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <h4 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
            {account.marketplace.marketplaceName}
          </h4>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {account.sellerName}
          </p>

        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            account.connectionStatus === "CONNECTED"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          }`}
        >
          {account.connectionStatus ===
          "CONNECTED" ? (
            <CheckCircle2 size={14} />
          ) : (
            <XCircle size={14} />
          )}

          {account.connectionStatus}
        </span>

      </div>

      {/* Info */}

      <div className="mt-5 space-y-3">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Seller Code
          </p>

          <p className="mt-1 text-sm font-semibold text-[#0A0E1A] dark:text-white">
            {account.sellerCode}
          </p>

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Display Name
          </p>

          <p className="mt-1 text-sm font-semibold text-[#0A0E1A] dark:text-white">
            {account.displayName || "--"}
          </p>

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Status
          </p>

          <span
            className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              account.isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
            }`}
          >
            {account.isActive
              ? "Active"
              : "Inactive"}
          </span>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={() => onEdit(account)}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:border-[#E8C16D] hover:bg-slate-50 hover:text-[#0A0E1A] active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.08] cursor-pointer"
        >
          <Pencil size={15} />

          Edit
        </button>

        <button
          onClick={() => onDelete(account)}
          className="flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs sm:text-sm font-semibold text-red-600 shadow-2xs transition-all hover:bg-red-100 hover:border-red-300 active:scale-[0.98] dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 cursor-pointer"
        >
          <Trash2 size={15} />

          Delete
        </button>

      </div>

    </div>
  );
}
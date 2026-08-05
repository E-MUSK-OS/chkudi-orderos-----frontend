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
    <div className="border border-[#E7E0D2] bg-white p-5 transition hover:border-[#C89B3C]">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <h4 className="text-lg font-bold text-[#0A0E1A]">
            {account.marketplace.marketplaceName}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {account.sellerName}
          </p>

        </div>

        <span
          className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold ${
            account.connectionStatus === "CONNECTED"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
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

          <p className="text-xs font-medium uppercase text-slate-400">
            Seller Code
          </p>

          <p className="mt-1 text-sm font-semibold">
            {account.sellerCode}
          </p>

        </div>

        <div>

          <p className="text-xs font-medium uppercase text-slate-400">
            Display Name
          </p>

          <p className="mt-1 text-sm font-semibold">
            {account.displayName || "--"}
          </p>

        </div>

        <div>

          <p className="text-xs font-medium uppercase text-slate-400">
            Status
          </p>

          <span
            className={`mt-1 inline-flex px-3 py-1 text-xs font-semibold ${
              account.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
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
          className="flex h-10 items-center gap-2 border border-[#E2E5EA] px-4 text-sm font-semibold hover:border-[#C89B3C]"
        >
          <Pencil size={16} />

          Edit
        </button>

        <button
          onClick={() => onDelete(account)}
          className="flex h-10 items-center gap-2 bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Trash2 size={16} />

          Delete
        </button>

      </div>

    </div>
  );
}
"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Package,
  Layers,
  Globe,
  Clock,
  AlertTriangle,
  Unlink,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import type { AmazonSellerAccount } from "../types/amazon.types";

interface AmazonAccountCardProps {
  account: AmazonSellerAccount;
  onSyncOrders: (account: AmazonSellerAccount) => Promise<void>;
  onSyncInventory: (account: AmazonSellerAccount) => Promise<void>;
  onSyncProducts: (account: AmazonSellerAccount) => Promise<void>;
  onReconnect: (account: AmazonSellerAccount) => Promise<void>;
  onDisconnect: (account: AmazonSellerAccount) => void;
  onViewHistory: (account: AmazonSellerAccount) => void;
}

export default function AmazonAccountCard({
  account,
  onSyncOrders,
  onSyncInventory,
  onSyncProducts,
  onReconnect,
  onDisconnect,
  onViewHistory,
}: AmazonAccountCardProps) {
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncingInventory, setSyncingInventory] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const isConnected = account.connectionStatus === "CONNECTED";
  const hasError = Boolean(account.connection?.lastError) || account.connectionStatus === "FAILED";

  const handleSyncOrders = async () => {
    try {
      setSyncingOrders(true);
      await onSyncOrders(account);
    } finally {
      setSyncingOrders(false);
    }
  };

  const handleSyncInventory = async () => {
    try {
      setSyncingInventory(true);
      await onSyncInventory(account);
    } finally {
      setSyncingInventory(false);
    }
  };

  const handleSyncProducts = async () => {
    try {
      setSyncingProducts(true);
      await onSyncProducts(account);
    } finally {
      setSyncingProducts(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setReconnecting(true);
      await onReconnect(account);
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/60 bg-amber-50 p-2 dark:border-amber-500/20 dark:bg-amber-500/10">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
                alt="Amazon"
                className="h-6 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-[#0A0E1A] dark:text-white text-base sm:text-lg leading-tight line-clamp-1">
                {account.displayName || account.sellerName}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                <Building2 size={12} className="inline shrink-0" />
                ID: {account.amazonSellerId || account.sellerCode}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : hasError ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Error Alert if any */}
        {hasError && account.connection?.lastError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="line-clamp-2">
              <span className="font-semibold">Sync Alert: </span>
              {account.connection.lastError}
            </div>
          </div>
        )}

        {/* Metadata Details Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Globe size={13} /> Region / Market
            </span>
            <p className="mt-1 font-semibold text-[#0A0E1A] dark:text-white">
              {account.connection?.marketplaceRegion || "EU"} • {account.marketplaces?.length ? `${account.marketplaces.length} active` : "Amazon.in"}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock size={13} /> Last Sync
            </span>
            <p className="mt-1 font-semibold text-[#0A0E1A] dark:text-white truncate">
              {account.connection?.lastSyncAt
                ? new Date(account.connection.lastSyncAt).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "Never synced"}
            </p>
          </div>
        </div>

        {/* Active Marketplaces Tags */}
        {account.marketplaces && account.marketplaces.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {account.marketplaces.map((m) => (
              <span
                key={m.marketplaceId}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-300"
              >
                <span className="font-bold">{m.countryCode}</span>
                <span>({m.currency})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08]">
        {/* Sync Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!isConnected || syncingOrders}
            onClick={handleSyncOrders}
            className="h-9 px-2 text-xs rounded-xl flex items-center justify-center gap-1.5"
            title="Sync Orders from SP-API"
          >
            <ShoppingBag size={13} className={syncingOrders ? "animate-spin" : ""} />
            <span>Orders</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={!isConnected || syncingInventory}
            onClick={handleSyncInventory}
            className="h-9 px-2 text-xs rounded-xl flex items-center justify-center gap-1.5"
            title="Sync Inventory Quantities"
          >
            <Layers size={13} className={syncingInventory ? "animate-spin" : ""} />
            <span>Inventory</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={!isConnected || syncingProducts}
            onClick={handleSyncProducts}
            className="h-9 px-2 text-xs rounded-xl flex items-center justify-center gap-1.5"
            title="Sync Catalog & ASINs"
          >
            <Package size={13} className={syncingProducts ? "animate-spin" : ""} />
            <span>Catalog</span>
          </Button>
        </div>

        {/* Secondary Account Actions */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => onViewHistory(account)}
            className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
          >
            Sync History <ChevronRight size={13} />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReconnect}
              disabled={reconnecting}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} className={reconnecting ? "animate-spin" : ""} />
              Reconnect
            </button>

            <span className="text-slate-300 dark:text-slate-600">|</span>

            <button
              type="button"
              onClick={() => onDisconnect(account)}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1 transition-colors"
            >
              <Unlink size={12} />
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

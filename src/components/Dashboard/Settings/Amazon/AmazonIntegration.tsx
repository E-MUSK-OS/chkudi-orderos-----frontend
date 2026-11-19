"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Button from "@/components/ui/Button";
import {
  Plus,
  RefreshCw,
  Store,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { amazonService } from "./services/amazon.service";
import type { AmazonSellerAccount, AmazonSyncLog } from "./types/amazon.types";
import AmazonStatsOverview from "./components/AmazonStatsOverview";
import AmazonAccountCard from "./components/AmazonAccountCard";
import ConnectAmazonModal from "./components/ConnectAmazonModal";
import SyncHistoryTable from "./components/SyncHistoryTable";
import SyncErrorModal from "./components/SyncErrorModal";
import Modal from "@/components/ui/Modal";

export default function AmazonIntegration() {
  const [activeTab, setActiveTab] = useState<"accounts" | "history" | "security">("accounts");
  const [accounts, setAccounts] = useState<AmazonSellerAccount[]>([]);
  const [logs, setLogs] = useState<AmazonSyncLog[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modals
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<AmazonSellerAccount | null>(null);
  const [selectedErrorLog, setSelectedErrorLog] = useState<AmazonSyncLog | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Load Accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const data = await amazonService.getAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load Amazon accounts.";
      toast.error(msg);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Load Sync Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await amazonService.getSyncLogs({ limit: 30 });
      setLogs(res.logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sync history.";
      toast.error(msg);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchLogs();
  }, [fetchAccounts, fetchLogs]);

  // Actions
  const handleSyncOrders = async (account: AmazonSellerAccount) => {
    try {
      toast.info(`Starting order sync for ${account.displayName || account.sellerName}...`);
      const res = await amazonService.syncOrders(account.id);
      toast.success(`Order sync completed: ${res.totalCreated} new, ${res.totalUpdated} updated.`);
      fetchAccounts();
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order sync failed.";
      toast.error(msg);
      fetchAccounts();
      fetchLogs();
    }
  };

  const handleSyncInventory = async (account: AmazonSellerAccount) => {
    try {
      toast.info(`Starting inventory sync for ${account.displayName || account.sellerName}...`);
      const res = await amazonService.syncInventory(account.id);
      toast.success(`Inventory sync completed: ${res.totalUpdated} updated.`);
      fetchAccounts();
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inventory sync failed.";
      toast.error(msg);
      fetchAccounts();
      fetchLogs();
    }
  };

  const handleSyncProducts = async (account: AmazonSellerAccount) => {
    try {
      toast.info(`Starting catalog sync for ${account.displayName || account.sellerName}...`);
      const res = await amazonService.syncProducts(account.id);
      toast.success(`Catalog sync completed: ${res.totalCreated} created, ${res.totalUpdated} updated.`);
      fetchAccounts();
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Catalog sync failed.";
      toast.error(msg);
      fetchAccounts();
      fetchLogs();
    }
  };

  const handleReconnect = async (account: AmazonSellerAccount) => {
    try {
      toast.info("Generating re-authorization link...");
      const res = await amazonService.reconnectAccount(
        account.id,
        account.connection?.marketplaceRegion || "EU"
      );
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate reconnection.";
      toast.error(msg);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      setDisconnecting(true);
      await amazonService.disconnectAccount(disconnectTarget.id);
      toast.success("Amazon seller account disconnected.");
      setDisconnectTarget(null);
      fetchAccounts();
      fetchLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect account.";
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DashboardLayout title="Amazon SP-API Integration">
      <div className="space-y-6">
        {/* Hero Card */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C89B3C] dark:text-[#F5C451]">
                  Official Selling Partner API
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck size={12} /> SP-API Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Amazon Marketplace Integration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Connect multiple Amazon Seller Central accounts with OAuth (LWA), automate order imports, sync FBA/FBM inventory, and print shipping labels seamlessly.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                fullWidth={false}
                onClick={() => {
                  fetchAccounts();
                  fetchLogs();
                }}
                className="h-11 px-3.5 rounded-2xl"
                title="Refresh data"
              >
                <RefreshCw size={16} className={loadingAccounts ? "animate-spin" : ""} />
              </Button>

              <Button
                fullWidth={false}
                className="h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
                onClick={() => setConnectModalOpen(true)}
              >
                <Plus size={18} />
                <span>Connect Amazon Seller</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview Banner */}
        <AmazonStatsOverview accounts={accounts} loading={loadingAccounts} />

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-[#E7E0D2] dark:border-white/[0.08] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[5px] ${
              activeTab === "accounts"
                ? "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Store size={16} />
            <span>Connected Accounts ({accounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[5px] ${
              activeTab === "history"
                ? "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <History size={16} />
            <span>Sync History & Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[5px] ${
              activeTab === "security"
                ? "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Security & OAuth Specs</span>
          </button>
        </div>

        {/* Tab 1: Accounts View */}
        {activeTab === "accounts" && (
          <div>
            {loadingAccounts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-3xl border border-[#E7E0D2] bg-white p-6 shadow-xs animate-pulse dark:border-white/[0.08] dark:bg-[#0F1626]"
                  />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#E7E0D2] bg-[#FAF8F5] p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-3 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <Store size={32} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#0A0E1A] dark:text-white">
                  No Amazon Seller Accounts Connected
                </h3>
                <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Authorize your Amazon Seller Central store to begin automated order fetching, real-time inventory sync, and multi-marketplace tracking.
                </p>
                <div className="mt-5">
                  <Button
                    fullWidth={false}
                    className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
                    onClick={() => setConnectModalOpen(true)}
                  >
                    <Plus size={18} />
                    <span>Connect Your First Store</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {accounts.map((acc) => (
                  <AmazonAccountCard
                    key={acc.id}
                    account={acc}
                    onSyncOrders={handleSyncOrders}
                    onSyncInventory={handleSyncInventory}
                    onSyncProducts={handleSyncProducts}
                    onReconnect={handleReconnect}
                    onDisconnect={(a) => setDisconnectTarget(a)}
                    onViewHistory={() => setActiveTab("history")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sync History View */}
        {activeTab === "history" && (
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
                  Synchronization Audit Log
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit trail of automated background jobs and manual API sync cycles.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                onClick={fetchLogs}
                className="h-9 px-3 rounded-xl text-xs"
              >
                <RefreshCw size={13} className={loadingLogs ? "animate-spin" : ""} />
                <span>Refresh Logs</span>
              </Button>
            </div>
            <SyncHistoryTable logs={logs} loading={loadingLogs} onViewError={(l) => setSelectedErrorLog(l)} />
          </div>
        )}

        {/* Tab 3: Security & Architecture Specs */}
        {activeTab === "security" && (
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                Security, OAuth & Production Compliance
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                This integration is designed following Amazon Selling Partner API Security Guidelines and Data Protection Policy.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs sm:text-sm">
              <div className="rounded-2xl border border-slate-200 bg-[#FAF8F5] p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <h4 className="font-bold text-[#0A0E1A] dark:text-white mb-2">
                  1. Token Security & AES-256-GCM Encryption
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Every LWA refresh token is encrypted using AES-256-GCM with a random initialization vector (IV) and authentication tag before insertion into PostgreSQL. No plaintext tokens are committed or stored in logs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FAF8F5] p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <h4 className="font-bold text-[#0A0E1A] dark:text-white mb-2">
                  2. CSRF & Replay Prevention
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  OAuth state parameters are signed with HMAC-SHA256, strictly validated upon callback, and enforced with a 15-minute expiration window to eliminate cross-site request forgery and replay attacks.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FAF8F5] p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <h4 className="font-bold text-[#0A0E1A] dark:text-white mb-2">
                  3. Rate Limiting, Backoff & Jitter
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  All SP-API requests track Amazon throttling headers (`x-amzn-RateLimit-Limit`) and implement exponential backoff with randomized jitter on HTTP 429 and 503 responses to safeguard API quotas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#FAF8F5] p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <h4 className="font-bold text-[#0A0E1A] dark:text-white mb-2">
                  4. Non-Destructive Multi-Tenant Architecture
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Multi-account isolation ensures each seller’s orders, inventory, and listings are partitioned by user and workspace. Existing Amazon Batch Scanning functionality remains fully compatible.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <ConnectAmazonModal open={connectModalOpen} onClose={() => setConnectModalOpen(false)} />

      {/* Disconnect Confirmation Modal */}
      <Modal
        open={Boolean(disconnectTarget)}
        onClose={() => setDisconnectTarget(null)}
        title="Disconnect Amazon Store"
        description="Are you sure you want to disconnect this Amazon seller account? Synchronization will cease immediately."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" fullWidth={false} onClick={() => setDisconnectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              fullWidth={false}
              disabled={disconnecting}
              onClick={handleConfirmDisconnect}
              className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect Account"}
            </Button>
          </div>
        }
      >
        <div className="p-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <p>
            You are about to disconnect:{" "}
            <span className="font-bold text-[#0A0E1A] dark:text-white">
              {disconnectTarget?.displayName || disconnectTarget?.sellerName}
            </span>{" "}
            (Seller ID: {disconnectTarget?.sellerCode}).
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Note: Existing synced orders and catalog data in OrderOS will NOT be deleted. You can reconnect this store at any time.
          </p>
        </div>
      </Modal>

      {/* Error Details Modal */}
      <SyncErrorModal
        open={Boolean(selectedErrorLog)}
        onClose={() => setSelectedErrorLog(null)}
        log={selectedErrorLog}
      />
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  LockKeyhole,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";

import Input from "@/components/ui/Input";
import type { MarketplaceAccount } from "@/services/marketplaceAccount/marketplaceAccount.types";
import {
  connectMyntra,
  disconnectMarketplace,
} from "@/services/marketplaceAccount/marketplaceAccount.service";

interface MyntraConnectionFormProps {
  account?: MarketplaceAccount | null;
  connecting?: boolean;
  setConnecting?: (connecting: boolean) => void;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function MyntraConnectionForm({
  account,
  connecting = false,
  setConnecting,
  onSuccess,
  onClose,
}: MyntraConnectionFormProps) {
  const [merchantId, setMerchantId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copiedTenantKey, setCopiedTenantKey] = useState(false);

  // Pre-fill existing credentials if available and clean up any duplicate lowercase tokens
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("myntra_access_token");
      localStorage.removeItem("myntra_refresh_token");
    }

    if (account?.connection?.credentials) {
      if (account.connection.credentials.merchantId) {
        setMerchantId(account.connection.credentials.merchantId);
      }
      if (account.connection.credentials.secretKey) {
        setSecretKey(account.connection.credentials.secretKey);
      }
    } else if (account?.connectionStatus === "NOT_CONNECTED") {
      setMerchantId("");
      setSecretKey("");
    }
  }, [account]);

  const existingTenantKey =
    account?.connection?.credentials?.tenantKey ||
    account?.connection?.tokenMetadata?.tenantKey ||
    (typeof window !== "undefined"
      ? localStorage.getItem("tenantKey")
      : null);

  const isConnected =
    account?.connectionStatus === "CONNECTED" || !!account?.connection;

  const handleCopyTenantKey = () => {
    if (!existingTenantKey) return;
    navigator.clipboard.writeText(existingTenantKey);
    setCopiedTenantKey(true);
    toast.success("Tenant Key copied to clipboard!");
    setTimeout(() => setCopiedTenantKey(false), 2000);
  };

  const handleDisconnect = async () => {
    if (!account?.id) return;
    try {
      setIsDisconnecting(true);
      await disconnectMarketplace(account.id);

      if (typeof window !== "undefined") {
        localStorage.removeItem("myntra_Access_token");
        localStorage.removeItem("myntra_Refresh_token");
        localStorage.removeItem("tenantKey");
        localStorage.removeItem("myntra_access_token");
        localStorage.removeItem("myntra_refresh_token");
      }

      toast.success("Myntra disconnected successfully.");
      setMerchantId("");
      setSecretKey("");
      onSuccess?.();
      onClose?.();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect Myntra."
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account?.id) {
      toast.error("Marketplace account not found.");
      return;
    }

    if (!merchantId.trim()) {
      toast.error("Merchant ID is required.");
      return;
    }

    if (!secretKey.trim()) {
      toast.error("Secret Key is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setConnecting?.(true);

      const res = await connectMyntra(account.id, {
        merchantId: merchantId.trim(),
        secretKey: secretKey.trim(),
      });

      if (res?.data) {
        const { myntra_Access_token, myntra_Refresh_token, tenantKey } =
          res.data;

        // 1. Store tokens and tenantKey in localStorage exactly as requested (only one clean set)
        if (typeof window !== "undefined") {
          localStorage.setItem("myntra_Access_token", myntra_Access_token);
          localStorage.setItem("myntra_Refresh_token", myntra_Refresh_token);
          localStorage.setItem("tenantKey", tenantKey);

          // Remove any lowercase duplicates
          localStorage.removeItem("myntra_access_token");
          localStorage.removeItem("myntra_refresh_token");
        }

        toast.success(
          "Myntra connected successfully! Access tokens & Tenant Key generated."
        );

        onSuccess?.();
        onClose?.();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to Myntra. Please verify credentials.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setConnecting?.(false);
    }
  };

  return (
    <form
      id="myntra-connection-form"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[#0A0E1A] dark:text-white">
          Myntra API Configuration
        </h3>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter your Myntra Secret Key and Merchant ID to establish a secure
          connection.
        </p>
      </div>

      {/* Connected Status Banner */}
      {isConnected && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              size={20}
              className="text-emerald-600 dark:text-emerald-400 shrink-0"
            />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Connected & Synchronized
              </p>
              {existingTenantKey && (
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Tenant Key:{" "}
                  <code className="font-mono font-bold bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded">
                    {existingTenantKey}
                  </code>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {existingTenantKey && (
              <button
                type="button"
                onClick={handleCopyTenantKey}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer shrink-0"
              >
                {copiedTenantKey ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Tenant Key
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer shrink-0"
              title="Disconnect this Myntra account"
            >
              <Unplug size={13} />
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      )}

      {/* Exactly 2 Credentials Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Merchant ID"
          placeholder="Enter Merchant ID (e.g. ASAAESFA)"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          leftIcon={<Building2 size={18} className="text-slate-400" />}
          required
          disabled={connecting || isSubmitting}
        />

        <div className="relative">
          <Input
            label="Secret Key"
            type={showSecret ? "text" : "password"}
            placeholder="Enter Secret Key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            leftIcon={<LockKeyhole size={18} className="text-slate-400" />}
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowSecret(!showSecret)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={showSecret ? "Hide Secret" : "Show Secret"}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
            disabled={connecting || isSubmitting}
          />
        </div>
      </div>

      {/* Information */}
      <div className="rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
        <h4 className="font-semibold text-[#0A0E1A] dark:text-[#F5C451]">
          Before Connecting
        </h4>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>API access must be enabled in your Myntra Seller / Partner Portal.</li>
          <li>
            Enter your official <strong>Merchant ID</strong> and <strong>Secret Key</strong> to authenticate.
          </li>
          <li>
            Connecting automatically generates <strong>myntra_Access_token</strong>, <strong>myntra_Refresh_token</strong>, and a unique <strong>tenantKey</strong> saved both in the database and your local storage.
          </li>
        </ul>
      </div>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import {
  KeyRound,
  LockKeyhole,
  Building2,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { amazonService } from "@/components/Dashboard/Settings/Amazon/services/amazon.service";
import { toast } from "sonner";

interface AmazonConnectionFormProps {
  accountId?: string;
}

export default function AmazonConnectionForm({ accountId }: AmazonConnectionFormProps) {
  const [region, setRegion] = useState("EU");
  const [connecting, setConnecting] = useState(false);

  const handleOAuthConnect = async () => {
    try {
      setConnecting(true);
      const data = await amazonService.getAuthUrl(region, accountId);
      if (data?.url) {
        toast.info("Redirecting to Amazon Seller Central...");
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate Amazon authorization.";
      toast.error(msg);
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[#0A0E1A] dark:text-white">
          Amazon Selling Partner API (SP-API)
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Connect your Amazon Seller account using official Login with Amazon (LWA) OAuth to sync orders, inventory, and listings.
        </p>
      </div>

      {/* Recommended Method: OAuth Button */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Recommended
              </span>
              <h4 className="font-bold text-[#0A0E1A] dark:text-white text-sm sm:text-base">
                Instant Seller Central Authorization
              </h4>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md">
              Authorize directly through Amazon. No manual API tokens or client secrets required. Secure and fully automated.
            </p>
          </div>

          <Button
            fullWidth={false}
            onClick={handleOAuthConnect}
            disabled={connecting}
            className="h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0"
          >
            {connecting ? "Connecting..." : "Authorize on Amazon"}
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>

      {/* Regional Selector */}
      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
          Select Marketplace Region
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {[
            { id: "EU", label: "India & Europe", desc: "Amazon.in, UK, Germany, UAE" },
            { id: "NA", label: "North America", desc: "US, Canada, Mexico" },
            { id: "FE", label: "Far East", desc: "Japan, Australia, Singapore" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegion(r.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                region === r.id
                  ? "border-amber-500 bg-amber-50/40 dark:border-amber-400 dark:bg-amber-500/10"
                  : "border-[#E7E0D2] bg-white hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.02]"
              }`}
            >
              <div className="font-bold text-[#0A0E1A] dark:text-white flex items-center justify-between">
                <span>{r.label}</span>
                {region === r.id && <Check size={14} className="text-amber-600" />}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-start gap-2.5">
        <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <span className="font-bold">Enterprise Encryption (AES-256-GCM)</span>
          <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90">
            All Amazon tokens are encrypted at rest with AES-256-GCM. OAuth states are verified with HMAC-SHA256 signatures to protect your store from CSRF attacks.
          </p>
        </div>
      </div>
    </div>
  );
}

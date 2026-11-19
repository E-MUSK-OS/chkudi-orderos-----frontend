"use client";

import React, { useState } from "react";
import { Globe, ShieldCheck, ExternalLink, AlertCircle, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { amazonService } from "../services/amazon.service";
import { toast } from "sonner";

interface ConnectAmazonModalProps {
  open: boolean;
  onClose: () => void;
}

const REGIONS = [
  {
    id: "EU",
    name: "India & Europe",
    desc: "Amazon.in, UK, Germany, France, Italy, Spain, UAE, Saudi Arabia",
    host: "sellercentral.amazon.in",
  },
  {
    id: "NA",
    name: "North America",
    desc: "United States, Canada, Mexico, Brazil",
    host: "sellercentral.amazon.com",
  },
  {
    id: "FE",
    name: "Far East",
    desc: "Japan, Australia, Singapore",
    host: "sellercentral.amazon.co.jp",
  },
];

export default function ConnectAmazonModal({ open, onClose }: ConnectAmazonModalProps) {
  const [selectedRegion, setSelectedRegion] = useState("EU");
  const [isBeta, setIsBeta] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const data = await amazonService.getAuthUrl(selectedRegion, undefined, isBeta);

      if (!data?.url) {
        throw new Error("No authorization URL returned by backend.");
      }

      toast.info("Redirecting to Amazon Seller Central...");

      // Redirect the user to Amazon's consent page
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate Amazon authorization.";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Connect Amazon Seller Central"
      description="Authorize Chkudi OrderOS to securely synchronize your Amazon orders, inventory, and listings via Selling Partner API."
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            fullWidth={false}
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-6"
          >
            {loading ? (
              <span>Preparing...</span>
            ) : (
              <>
                <span>Authorize on Amazon</span>
                <ExternalLink size={15} />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 p-1 sm:p-2">
        {/* Region Selector */}
        <div>
          <label className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white flex items-center gap-1.5 mb-2.5">
            <Globe size={16} className="text-amber-500" />
            Select Your Marketplace Region
          </label>
          <div className="grid gap-2.5">
            {REGIONS.map((region) => {
              const isSelected = selectedRegion === region.id;
              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegion(region.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/50 dark:border-amber-400 dark:bg-amber-500/10"
                      : "border-[#E7E0D2] bg-white hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#0A0E1A] dark:text-white">{region.name}</h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{region.desc}</p>
                    <p className="mt-1 font-mono text-[11px] text-amber-700 dark:text-amber-300">{region.host}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Token Info Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
          <ShieldCheck size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <span className="font-bold">Enterprise Encryption (AES-256-GCM)</span>
            <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90">
              Your Amazon refresh tokens are encrypted at rest using military-grade AES-256-GCM. Credentials are never exposed to the frontend or third parties.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02] text-xs text-slate-600 dark:text-slate-400">
          <h5 className="font-bold text-[#0A0E1A] dark:text-white mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            What happens next?
          </h5>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>You will be redirected to Amazon Seller Central to approve API permissions.</li>
            <li>Login with your primary Seller Central account credentials.</li>
            <li>Confirm permissions for Orders, Inventory, Listings, and Pricing.</li>
            <li>Amazon will redirect you back to Chkudi OrderOS with your store connected.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}

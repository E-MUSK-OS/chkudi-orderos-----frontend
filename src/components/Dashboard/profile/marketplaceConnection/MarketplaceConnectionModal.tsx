"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { MarketplaceAccount } from "@/services/marketplaceAccount/marketplaceAccount.types";

import MarketplaceFormRenderer from "./MarketplaceFormRenderer";
import { MARKETPLACE_LOGOS } from "@/constants/marketplaces";

interface MarketplaceConnectionModalProps {
  open: boolean;

  onClose: () => void;

  account: MarketplaceAccount | null;
}

export default function MarketplaceConnectionModal({
  open,
  onClose,
  account,
}: MarketplaceConnectionModalProps) {
  if (!account) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Connect ${account.marketplace.marketplaceName}`}
      description="Configure your marketplace credentials to enable order synchronization."
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" fullWidth={false} onClick={onClose}>
            Cancel
          </Button>

          <Button fullWidth={false}>Connect</Button>
        </div>
      }
    >
      <div className="space-y-8 p-6">
        {/* Marketplace Info */}

        <div className="flex items-center gap-4 rounded-2xl border border-[#E7E0D2] bg-[#FCFBF8] p-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-2 shadow-2xs dark:border-white/[0.08] dark:bg-white/[0.04]">
            <img
              src={
                MARKETPLACE_LOGOS[
                  account.marketplace.marketplaceCode.toUpperCase()
                ] || "/image/marketplaces/default.png"
              }
              alt={account.marketplace.marketplaceName}
              className="h-20 w-20 object-contain"
            />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#0A0E1A] dark:text-white">
              {account.marketplace.marketplaceName}
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Seller : {account.sellerName}
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Seller Code : {account.sellerCode}
            </p>
          </div>
        </div>

        {/* Dynamic Marketplace Form */}

        <MarketplaceFormRenderer account={account} />
      </div>
    </Modal>
  );
}

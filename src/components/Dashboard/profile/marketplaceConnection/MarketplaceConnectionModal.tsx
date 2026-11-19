"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import type { MarketplaceAccount } from "@/services/marketplaceAccount/marketplaceAccount.types";
import { disconnectMarketplace } from "@/services/marketplaceAccount/marketplaceAccount.service";

import MarketplaceFormRenderer from "./MarketplaceFormRenderer";
import { MARKETPLACE_LOGOS } from "@/constants/marketplaces";

interface MarketplaceConnectionModalProps {
  open: boolean;
  onClose: () => void;
  account: MarketplaceAccount | null;
  onSuccess?: () => void;
}

export default function MarketplaceConnectionModal({
  open,
  onClose,
  account,
  onSuccess,
}: MarketplaceConnectionModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  if (!account) {
    return null;
  }

  const isMyntra = account.marketplace.marketplaceCode === "MYNTRA";
  const isConnected = account.connectionStatus === "CONNECTED" || !!account.connection;

  const handleModalDisconnect = async () => {
    if (!account?.id) return;
    try {
      setDisconnecting(true);
      await disconnectMarketplace(account.id);

      if (typeof window !== "undefined") {
        localStorage.removeItem("myntra_Access_token");
        localStorage.removeItem("myntra_Refresh_token");
        localStorage.removeItem("tenantKey");
        localStorage.removeItem("myntra_access_token");
        localStorage.removeItem("myntra_refresh_token");
      }

      toast.success("Marketplace disconnected successfully.");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to disconnect marketplace."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`Connect ${account.marketplace.marketplaceName}`}
      description="Configure your marketplace credentials to enable order synchronization."
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            fullWidth={false}
            onClick={onClose}
            disabled={connecting || disconnecting}
          >
            Cancel
          </Button>

          {isConnected ? (
            <Button
              variant="danger"
              fullWidth={false}
              onClick={handleModalDisconnect}
              loading={disconnecting}
              disabled={connecting || disconnecting}
              className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 active:scale-[0.98]"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          ) : isMyntra ? (
            <Button
              fullWidth={false}
              type="submit"
              form="myntra-connection-form"
              disabled={connecting}
              className="min-w-[100px]"
            >
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button fullWidth={false}>Connect</Button>
          )}
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
        <MarketplaceFormRenderer
          account={account}
          connecting={connecting}
          setConnecting={setConnecting}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}

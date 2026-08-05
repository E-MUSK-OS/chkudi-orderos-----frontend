"use client";

import Modal from "@/components/ui/Modal";

import MarketplaceAccountForm from "./MarketplaceAccountForm";

import type {
  Marketplace,
  MarketplaceAccount,
  MarketplaceAccountPayload,
} from "@/services/marketplaceAccount/marketplaceAccount.types";

interface MarketplaceAccountModalProps {
  open: boolean;

  onClose: () => void;

  marketplaces: Marketplace[];

  account?: MarketplaceAccount | null;

  loading?: boolean;

  onSubmit: (
    data: MarketplaceAccountPayload
  ) => Promise<boolean>;
}

export default function MarketplaceAccountModal({
  open,
  onClose,
  marketplaces,
  account,
  loading = false,
  onSubmit,
}: MarketplaceAccountModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        account
          ? "Edit Marketplace Account"
          : "Add Marketplace Account"
      }
      description={
        account
          ? "Update your marketplace seller account."
          : "Connect a new marketplace seller account."
      }
    >
      <MarketplaceAccountForm
        marketplaces={marketplaces}
        account={account}
        loading={loading}
        onSubmit={onSubmit}
        onSuccess={onClose}
      />
    </Modal>
  );
}
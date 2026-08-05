"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";

import MarketplaceAccountCard from "./MarketplaceAccountCard";
import MarketplaceAccountModal from "./MarketplaceAccountModal";
import MarketplaceAccountTable from "./MarketplaceAccountTable";

import useMarketplaceAccount from "./hooks/useMarketplaceAccount";

import type {
  MarketplaceAccount,
  MarketplaceAccountPayload,
} from "@/services/marketplaceAccount/marketplaceAccount.types";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MarketplaceConnectionModal from "./marketplaceConnection/MarketplaceConnectionModal";

export default function MarketplaceAccounts() {
  const {
    marketplaces,
    accounts,
    loading,

    addMarketplaceAccount,
    editMarketplaceAccount,
    deleteMarketplaceAccount,
    toggleStatus,
  } = useMarketplaceAccount();

  // ======================================================
  // State
  // ======================================================

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] =
    useState<MarketplaceAccount | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);

  // ======================================================
  // Create / Update
  // ======================================================

  const handleSubmit = async (data: MarketplaceAccountPayload) => {
    try {
      setSubmitting(true);

      let success = false;

      if (selectedAccount) {
        success = await editMarketplaceAccount(selectedAccount.id, data);
      } else {
        success = await addMarketplaceAccount(data);
      }

      if (success) {
        toast.success(
          selectedAccount
            ? "Marketplace account updated successfully."
            : "Marketplace account created successfully.",
        );

        setModalOpen(false);

        setSelectedAccount(null);
      }

      return success;
    } catch {
      toast.error("Something went wrong.");

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) {
      return;
    }

    try {
      setDeleteLoading(true);

      const success = await deleteMarketplaceAccount(selectedAccount.id);

      if (success) {
        toast.success("Marketplace account deleted successfully.");

        setDeleteOpen(false);

        setSelectedAccount(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (account: MarketplaceAccount) => {
    const success = await toggleStatus(account.id);

    if (!success) {
      return;
    }

    toast.success(
      account.isActive
        ? "Marketplace account deactivated successfully."
        : "Marketplace account activated successfully.",
    );
  };

  const handleConnect = (account: MarketplaceAccount) => {
    setSelectedAccount(account);

    setConnectionOpen(true);
  };

  return (
    <>
      <section className="border border-[#E7E0D2] bg-white p-5 shadow-sm">
        {/* Header */}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-[#0A0E1A]">
              Marketplace Accounts
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Connect and manage your marketplace seller accounts.
            </p>
          </div>

          <Button
            fullWidth={false}
            leftIcon={<Plus size={18} />}
            onClick={() => {
              setSelectedAccount(null);

              setModalOpen(true);
            }}
          >
            Add Marketplace
          </Button>
        </div>

        {/* Body */}

        <div className="mt-6">
          {loading && <p className="text-sm text-slate-500">Loading...</p>}

          {!loading && accounts.length === 0 && (
            <div className="flex h-52 flex-col items-center justify-center border border-dashed border-[#E7E0D2]">
              <h4 className="text-lg font-semibold">
                No Marketplace Connected
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Connect your first marketplace account to start syncing orders.
              </p>
            </div>
          )}

          {!loading && accounts.length > 0 && (
            <MarketplaceAccountTable
              accounts={accounts}
              onEdit={(account) => {
                setSelectedAccount(account);

                setModalOpen(true);
              }}
              onDelete={(account) => {
                setSelectedAccount(account);

                setDeleteOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
              onConnect={handleConnect}
            />
          )}
        </div>
      </section>

      {/* Modal */}

      <MarketplaceAccountModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);

          setSelectedAccount(null);
        }}
        marketplaces={marketplaces}
        account={selectedAccount}
        loading={submitting}
        onSubmit={handleSubmit}
      />

      <MarketplaceConnectionModal
        open={connectionOpen}
        onClose={() => {
          setConnectionOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);

          setSelectedAccount(null);
        }}
        loading={deleteLoading}
        onConfirm={handleDelete}
        title="Delete Marketplace Account"
        description="Are you sure you want to delete this marketplace account?"
      />
    </>
  );
}

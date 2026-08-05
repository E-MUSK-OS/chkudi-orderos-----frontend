"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getMarketplaces,
  getMarketplaceAccounts,
  createMarketplaceAccount,
  updateMarketplaceAccount,
  deleteMarketplaceAccount as deleteMarketplaceAccountApi,
  toggleMarketplaceAccountStatus,
} from "@/services/marketplaceAccount/marketplaceAccount.service";

import type {
  Marketplace,
  MarketplaceAccount,
  MarketplaceAccountPayload,
} from "@/services/marketplaceAccount/marketplaceAccount.types";

export default function useMarketplaceAccount() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([]);

  const [loading, setLoading] = useState(false);

  // ======================================================
  // Load Marketplaces
  // ======================================================

  const loadMarketplaces = async () => {
    try {
      const res = await getMarketplaces();

      setMarketplaces(res.data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load marketplaces.",
      );
    }
  };

  // ======================================================
  // Load Marketplace Accounts
  // ======================================================

  const loadMarketplaceAccounts = async () => {
    try {
      setLoading(true);

      const res = await getMarketplaceAccounts();

      setAccounts(res.data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load marketplace accounts.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Create
  // ======================================================

  const addMarketplaceAccount = async (data: MarketplaceAccountPayload) => {
    try {
      await createMarketplaceAccount(data);

      toast.success("Marketplace account created successfully.");

      await loadMarketplaceAccounts();

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create marketplace account.",
      );

      return false;
    }
  };

  // ======================================================
  // Update
  // ======================================================

  const editMarketplaceAccount = async (
    id: string,
    data: Partial<MarketplaceAccountPayload>,
  ) => {
    try {
      await updateMarketplaceAccount(id, data);

      toast.success("Marketplace account updated successfully.");

      await loadMarketplaceAccounts();

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update marketplace account.",
      );

      return false;
    }
  };

  // ======================================================
  // Delete
  // ======================================================

  const deleteMarketplaceAccount = async (id: string) => {
    try {
      await deleteMarketplaceAccountApi(id);

      toast.success("Marketplace account deleted successfully.");

      await loadMarketplaceAccounts();

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete marketplace account.",
      );

      return false;
    }
  };

  // ======================================================
  // Toggle Status
  // ======================================================

  const toggleStatus = async (id: string) => {
    try {
      await toggleMarketplaceAccountStatus(id);

      await loadMarketplaceAccounts();

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update marketplace account status.",
      );

      return false;
    }
  };

  // ======================================================
  // Init
  // ======================================================

  useEffect(() => {
    loadMarketplaces();
    loadMarketplaceAccounts();
  }, []);

  return {
    loading,

    marketplaces,

    accounts,

    addMarketplaceAccount,

    editMarketplaceAccount,

    deleteMarketplaceAccount,

    toggleStatus,

    refresh: loadMarketplaceAccounts,
  };
}

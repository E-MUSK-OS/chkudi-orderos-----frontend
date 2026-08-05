import { api } from "../api";
import { getToken } from "@/utils/auth";

import {
  MarketplaceListResponse,
  MarketplaceAccountListResponse,
  MarketplaceAccountPayload,
  MarketplaceAccount,
} from "./marketplaceAccount.types";

// ==================================================================================
// ========================== GET ALL MARKETPLACES ==================================
// ==================================================================================

export const getMarketplaces = () => {
  return api.get<MarketplaceListResponse>(
    "/marketplaces",
    getToken()
  );
};

// ==================================================================================
// ====================== GET MARKETPLACE ACCOUNTS ==================================
// ==================================================================================

export const getMarketplaceAccounts = () => {
  return api.get<MarketplaceAccountListResponse>(
    "/marketplace-accounts",
    getToken()
  );
};

// ==================================================================================
// ======================= GET MARKETPLACE ACCOUNT BY ID ============================
// ==================================================================================

export const getMarketplaceAccountById = (
  id: string
) => {
  return api.get<{
    success: boolean;
    message: string;
    data: MarketplaceAccount;
  }>(
    `/marketplace-accounts/${id}`,
    getToken()
  );
};

// ==================================================================================
// ====================== CREATE MARKETPLACE ACCOUNT ================================
// ==================================================================================

export const createMarketplaceAccount = (
  data: MarketplaceAccountPayload
) => {
  return api.post(
    "/marketplace-accounts",
    data,
    getToken()
  );
};

// ==================================================================================
// ====================== UPDATE MARKETPLACE ACCOUNT ================================
// ==================================================================================

export const updateMarketplaceAccount = (
  id: string,
  data: Partial<MarketplaceAccountPayload>
) => {
  return api.patch(
    `/marketplace-accounts/${id}`,
    data,
    getToken()
  );
};

// ==================================================================================
// ====================== DELETE MARKETPLACE ACCOUNT ================================
// ==================================================================================

export const deleteMarketplaceAccount = (
  id: string
) => {
  return api.delete(
    `/marketplace-accounts/${id}`,
    getToken()
  );
};

// ==================================================================================
// =================== TOGGLE MARKETPLACE ACCOUNT STATUS ============================
// ==================================================================================

export const toggleMarketplaceAccountStatus = (
  id: string
) => {
  return api.patch(
    `/marketplace-accounts/${id}/status`,
    {},
    getToken()
  );
};
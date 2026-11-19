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

// ==================================================================================
// ====================== CONNECT MYNTRA MARKETPLACE ================================
// ==================================================================================

export const connectMyntra = (
  accountId: string,
  data: { secretKey: string; merchantId: string }
) => {
  return api.post<{
    success: boolean;
    message: string;
    data: {
      myntra_Access_token: string;
      myntra_Refresh_token: string;
      tenantKey: string;
      merchantId: string;
      connectionStatus: string;
    };
  }>(
    `/marketplace-accounts/${accountId}/connect-myntra`,
    data,
    getToken()
  );
};

// ==================================================================================
// ==================== DISCONNECT MARKETPLACE ACCOUNT ==============================
// ==================================================================================

export const disconnectMarketplace = (accountId: string) => {
  return api.post<{
    success: boolean;
    message: string;
  }>(
    `/marketplace-accounts/${accountId}/disconnect`,
    {},
    getToken()
  );
};

// ==================================================================================
// ==================== GET MARKETPLACE CONNECTION ==================================
// ==================================================================================

export const getMarketplaceConnection = (accountId: string) => {
  return api.get<{
    success: boolean;
    message: string;
    data: any;
  }>(
    `/marketplace-accounts/${accountId}/connection`,
    getToken()
  );
};

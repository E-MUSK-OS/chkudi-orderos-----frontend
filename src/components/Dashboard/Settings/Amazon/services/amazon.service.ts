import axiosInstance from "@/services/axios";
import type {
  AmazonSellerAccount,
  AmazonSyncLog,
  SyncResult,
} from "../types/amazon.types";

export const amazonService = {
  /**
   * Fetches all Amazon seller accounts and connection statuses for the user.
   */
  async getAccounts(): Promise<AmazonSellerAccount[]> {
    const res = await axiosInstance.get("/amazon/auth/status");
    return res.data?.data || [];
  },

  /**
   * Generates the official Amazon OAuth authorization URL.
   */
  async getAuthUrl(region: string = "EU", marketplaceAccountId?: string, isBeta: boolean = true): Promise<{ url: string; state: string; region: string }> {
    const params = new URLSearchParams({ region });
    if (marketplaceAccountId) {
      params.append("marketplaceAccountId", marketplaceAccountId);
    }
    if (isBeta) {
      params.append("isBeta", "true");
    }
    const res = await axiosInstance.get(`/amazon/auth/login?${params.toString()}`);
    return res.data?.data;
  },

  /**
   * Disconnects an Amazon Seller account.
   */
  async disconnectAccount(marketplaceAccountId: string): Promise<{ success: boolean; message: string }> {
    const res = await axiosInstance.post("/amazon/auth/disconnect", { marketplaceAccountId });
    return res.data;
  },

  /**
   * Reconnects an existing Amazon Seller account.
   */
  async reconnectAccount(marketplaceAccountId: string, region: string = "EU"): Promise<{ url: string; state: string }> {
    const res = await axiosInstance.post("/amazon/auth/reconnect", { marketplaceAccountId, region });
    return res.data?.data;
  },

  /**
   * Triggers manual synchronization of Amazon Orders.
   */
  async syncOrders(marketplaceAccountId: string, syncType: "INCREMENTAL" | "HISTORICAL" = "INCREMENTAL", lookbackDays: number = 7): Promise<SyncResult> {
    const res = await axiosInstance.post("/amazon/orders/sync", {
      marketplaceAccountId,
      syncType,
      lookbackDays,
    });
    return res.data?.data;
  },

  /**
   * Triggers manual synchronization of Amazon Inventory.
   */
  async syncInventory(marketplaceAccountId: string): Promise<SyncResult> {
    const res = await axiosInstance.post("/amazon/inventory/sync", {
      marketplaceAccountId,
    });
    return res.data?.data;
  },

  /**
   * Triggers manual synchronization of Amazon Products.
   */
  async syncProducts(marketplaceAccountId: string): Promise<SyncResult> {
    const res = await axiosInstance.post("/amazon/products/sync", {
      marketplaceAccountId,
    });
    return res.data?.data;
  },

  /**
   * Retrieves synchronization history logs with pagination.
   */
  async getSyncLogs(params: {
    marketplaceAccountId?: string;
    syncType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ logs: AmazonSyncLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.marketplaceAccountId) query.append("marketplaceAccountId", params.marketplaceAccountId);
    if (params.syncType) query.append("syncType", params.syncType);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await axiosInstance.get(`/amazon/orders/sync-logs?${query.toString()}`);
    return {
      logs: res.data?.data || [],
      pagination: res.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },
};

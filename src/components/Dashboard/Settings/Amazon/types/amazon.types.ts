export type AmazonConnectionStatus = "CONNECTED" | "NOT_CONNECTED" | "CONNECTING" | "FAILED";

export interface AmazonSellerMarketplace {
  marketplaceId: string;
  countryCode: string;
  name: string;
  currency: string;
  domainName?: string;
  isParticipating: boolean;
}

export interface AmazonAccountConnection {
  status: AmazonConnectionStatus;
  marketplaceRegion: string;
  defaultMarketplaceId?: string;
  authorizedAt?: string;
  lastConnectedAt?: string;
  lastSyncAt?: string;
  lastOrderSyncAt?: string;
  lastInventorySyncAt?: string;
  lastProductSyncAt?: string;
  lastError?: string | null;
  hasRefreshToken: boolean;
}

export interface AmazonSellerAccount {
  id: string;
  sellerName: string;
  sellerCode: string;
  amazonSellerId: string;
  displayName: string;
  isActive: boolean;
  connectionStatus: AmazonConnectionStatus;
  createdAt: string;
  updatedAt: string;
  connection: AmazonAccountConnection | null;
  marketplaces: AmazonSellerMarketplace[];
  stats: {
    totalOrders: number;
    totalSyncLogs: number;
  };
}

export interface AmazonSyncLog {
  id: string;
  userId: string;
  marketplaceAccountId: string;
  syncType: "ORDERS" | "INVENTORY" | "PRODUCTS" | "REPORTS" | "SHIPMENTS" | "AUTH_CONNECT" | "AUTH_DISCONNECT";
  status: "STARTED" | "SUCCESS" | "FAILED" | "PARTIAL";
  startedAt: string;
  completedAt?: string | null;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorMessage?: string | null;
  details?: Record<string, unknown> | null;
  triggeredBy: string;
  marketplaceAccount?: {
    id: string;
    sellerName: string;
    sellerCode: string;
    displayName: string;
  };
}

export interface SyncResult {
  totalProcessed: number;
  totalCreated: number;
  totalUpdated: number;
  totalFailed: number;
}

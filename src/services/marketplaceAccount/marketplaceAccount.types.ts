export interface Marketplace {
  id: string;

  marketplaceName: string;

  marketplaceCode: string;

  description?: string;

  displayOrder: number;

  isActive: boolean;
}

export interface MarketplaceAccount {
  id: string;

  marketplaceId: string;

  sellerName: string;

  sellerCode: string;

  displayName?: string;

  connectionStatus: string;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;

  marketplace: Marketplace;
}

export interface MarketplaceAccountPayload {
  marketplaceId: string;

  sellerName: string;

  sellerCode: string;

  displayName?: string;

  isActive?: boolean;
}

export interface MarketplaceListResponse {
  success: boolean;

  message: string;

  data: Marketplace[];
}

export interface MarketplaceAccountListResponse {
  success: boolean;

  message: string;

  data: MarketplaceAccount[];

  pagination: {
    total: number;

    page: number;

    limit: number;

    totalPages: number;
  };
}
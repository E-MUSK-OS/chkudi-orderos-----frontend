export interface Webstore {
  id: string;
  userId: string;

  // 1. Basic Information
  code: number;
  marketplaceName: string;
  marketplaceLogo?: string | null;
  storeName: string;
  parentOrChild: "Parent" | "Child" | string;
  registeredEmail?: string | null;
  contactUsEmail?: string | null;
  registeredPhone?: string | null;
  contactUsPhone?: string | null;
  registrationDate: string;
  skuCount: number;

  // 2. Address / Billing Details
  billTo?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  pincode?: string | null;
  state?: string | null;
  gstNo?: string | null;

  // 3. Bank Account
  bankAccount?: string | null;
  bankIfscCode?: string | null;
  lastPaymentDate?: string | null;

  // 4. Configuration Flags
  isActive: boolean;
  returnActive: boolean;
  isOnTpBased: boolean;
  isOnResellerBased: boolean;
  validateStoreBeforeUploading: boolean;
  isManifestBasedSalesInvoice: boolean;
  warehouseCode?: string | null;

  // 5. Legacy API Configuration
  sellerId?: string | null;
  secretKey?: string | null;
  marketplaceId?: string | null;
  authToken?: string | null;
  awsAccessKey?: string | null;
  endPoints?: string | null;

  // 6. Selling Partner API Configuration (SP-API)
  spapiOauthCode?: string | null;
  sellingPartnerId?: string | null;
  mwsAuthToken?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  spMarketplaceId?: string | null;
  spClientId?: string | null;
  spClientSecret?: string | null;
  spAwsAccessKey?: string | null;
  spAwsSecretKey?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface WebstoreFilterState {
  search: string;
  marketplaceName: string;
  isActive: "All" | "Active" | "Inactive";
  sortBy: string;
  sortOrder: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export type WebstoreViewMode = "list" | "create" | "edit";

export const MARKETPLACE_CHANNELS = [
  "Amazon",
  "AJIO-DROPSHIP",
  "CloudTail",
  "Flipkart",
  "Myntra",
  "Meesho",
  "JioMart",
  "Nykaa",
  "TataCliq",
  "Custom Channel",
] as const;

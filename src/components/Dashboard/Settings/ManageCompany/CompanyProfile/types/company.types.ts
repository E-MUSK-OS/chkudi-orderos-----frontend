export type CompanyStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  companyCode: string;
  ownerName: string;
  gstNumber: string;
  panNumber?: string | null;
  email?: string | null;
  phone?: string | null;

  // General Details
  legalName?: string | null;
  brandName?: string | null;
  abbreviation?: string | null;
  businessType?: string | null;
  website?: string | null;

  // Shorthand Address
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;

  // Contact Details - Billing
  billingAddress1?: string | null;
  billingAddress2?: string | null;
  billingAddress3?: string | null;
  billingPincode?: string | null;
  billingArea?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingCountry?: string | null;
  billingContactName?: string | null;
  billingContactNo?: string | null;

  // Contact Details - Shipping
  shippingSameAsBilling?: boolean;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingAddress3?: string | null;
  shippingPincode?: string | null;
  shippingArea?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCountry?: string | null;
  shippingContactName?: string | null;
  shippingContactNo?: string | null;

  // Accounting Details - Legal
  tanNumber?: string | null;
  cstNumber?: string | null;
  fssaiNumber?: string | null;
  tradeCategory?: string | null;
  msmeNumber?: string | null;

  // Bank Info
  bankName?: string | null;
  accountHolderName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountType?: string | null;
  branchName?: string | null;
  upiId?: string | null;
  clientCode?: string | null;
  productCode?: string | null;

  // Invoice & Other Details
  taxInvoicePrefix?: string | null;
  taxInvoiceNext?: string | null;
  retailInvoicePrefix?: string | null;
  retailInvoiceNext?: string | null;
  considerInPnL?: string | null;

  // Logo & Signature
  logoUrl?: string | null;
  signatureUrl?: string | null;
  completionPercentage?: number | null;

  status: CompanyStatus;
  isDefault: boolean;
  registrationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFilterState {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface CreateCompanyDraftPayload {
  gstNumber: string;
  companyName?: string;
  branchName?: string | null;
  parentCompanyName?: string | null;
  parentCompanyId?: string | null;
  companyCode?: string;
  ownerName?: string;
}

export interface CompanyBranchItem {
  companyId?: string;
  id: string;
  companyName: string;
  branchName: string;
  displayName: string;
  gstNumber: string;
  status: string;
  createdAt?: string;
}

export interface CreateCompanyBranchPayload {
  companyId: string;
  branchName: string;
  gstNumber: string;
  status?: string;
}

export type UpdateCompanyPayload = Partial<Omit<Company, "id" | "userId" | "createdAt" | "updatedAt">>;

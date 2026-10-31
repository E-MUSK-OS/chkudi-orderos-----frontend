export interface Ledger {
  id: string;
  userId: string;
  partyName: string;
  accountCode?: string | null;
  alias?: string | null;
  accountHead: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;

  // Billing Address
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  // Shipping Address
  shippingSameAsBilling: boolean;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingAddress3?: string | null;
  shippingArea?: string | null;
  shippingCountry?: string | null;
  shippingState?: string | null;
  shippingCity?: string | null;
  shippingPincode?: string | null;
  shippingPhone?: string | null;

  // Taxation & Legal Details
  pan?: string | null;
  gstin?: string | null;
  gstDate?: string | null;
  cstNo?: string | null;
  cstDate?: string | null;
  serviceTaxNo?: string | null;
  serviceTaxDate?: string | null;
  otherTaxNo?: string | null;
  otherTaxDate?: string | null;
  msmeNumber?: string | null;
  legalName?: string | null;

  // Other Details
  billDueDays: number;
  creditLimit: number;
  debitLimit: number;
  creditDebitLimit?: number | null;
  refContactName?: string | null;

  // Bank Info
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  branchName?: string | null;
  accountType?: string | null;
  ifsc?: string | null;

  // Opening Balance & Status
  openingBalance: number;
  balanceType: string;
  joinDate?: string | null;
  isActive: boolean;
  logoUrl?: string | null;
  completionPercentage?: number | null;

  // Audit
  createdByName?: string | null;
  updatedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLedgerPayload {
  partyName: string;
  ledgerName?: string;
  alias?: string;
  accountCode?: string;
  accountHead: string;
  contactPerson?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  contactNo?: string;

  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  shippingSameAsBilling?: boolean;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingAddress3?: string;
  shippingArea?: string;
  shippingCountry?: string;
  shippingState?: string;
  shippingCity?: string;
  shippingPincode?: string;
  shippingPhone?: string;

  pan?: string;
  panNumber?: string;
  gstin?: string;
  gstNumber?: string;
  msmeNumber?: string;
  legalName?: string;

  bankName?: string;
  accountHolderName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  ifsc?: string;
  ifscCode?: string;

  creditDebitLimit?: number;
  creditLimit?: number;
  debitLimit?: number;
  billDueDays?: number;
  refContactName?: string;

  openingBalance?: number;
  balanceType?: string;
  joinDate?: string;
  creationDate?: string;
  isActive?: boolean;
  logoUrl?: string;
  completionPercentage?: number;
}

export type UpdateLedgerPayload = Partial<CreateLedgerPayload>;

export interface LedgerFilterState {
  search: string;
  ledgerName: string;
  accountHead: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}


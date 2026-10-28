export interface SalesChallanItem {
  id?: string;
  itemNo: number;
  sku: string;
  name: string;
  quantity: number;
  rate: number;
  amount?: number;
  dispatchDate?: string;
  subCn?: string;
  remarks?: string;
  printBarcode?: boolean;
}

export interface Party {
  id: string;
  partyName: string;
  accountCode?: string | null;
  alias?: string | null;
  accountHead: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  shippingSameAsBilling?: boolean;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingAddress3?: string | null;
  shippingArea?: string | null;
  shippingCountry?: string | null;
  shippingState?: string | null;
  shippingCity?: string | null;
  shippingPincode?: string | null;
  shippingPhone?: string | null;

  pan?: string | null;
  gstin?: string | null;
  gstDate?: string | null;
  cstNo?: string | null;
  cstDate?: string | null;
  serviceTaxNo?: string | null;
  serviceTaxDate?: string | null;
  otherTaxNo?: string | null;
  otherTaxDate?: string | null;
  billDueDays?: number;
  creditLimit?: number;
  debitLimit?: number;

  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  openingBalance: number;
  balanceType: "Credit" | "Debit";
  joinDate?: string;
  isActive: boolean;
}

export interface SalesChallan {
  id: string;
  userId: string;
  partyId?: string | null;
  partyName: string;
  contactNo?: string | null;
  challanNo: string;
  challanRefNo?: string | null;
  challanDate: string;
  challanFor: string;
  stockOutFrom: string;
  consigneeName: string;
  deliveryBy: string;
  preparedBy?: string | null;
  deliveryTerms?: string | null;
  totalQuantity: number;
  totalAmount: number;
  invoiceStatus: string;
  isStockOut: boolean;
  items: SalesChallanItem[];
  party?: Party | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallanFiltersState {
  challanNo: string;
  challanRefNo: string;
  partyName: string;
  productSku: string;
  startDate: string;
  endDate: string;
  invoiceStatus: string;
  challanFor: string;
}

export interface ProductSkuSuggestion {
  sku: string;
  name: string;
  rate: number;
}

export const ACCOUNT_HEAD_OPTIONS = [
  "Advertisement",
  "Agent/Broker",
  "Bank A/C",
  "Bulidings",
  "Capital A/C",
  "Cash A/C",
  "Closing Stock",
  "Duties And Taxes",
  "Expense A/C",
  "Expense A/C (P & L)",
  "Expense A/C (Trading)",
  "Expense On Product A/C",
  "Fixed Asset",
  "Furniture Assets",
  "Income A/C (P & L)",
  "Income A/C (Trading)",
  "Investments",
  "Lib Provisions",
  "Loans & Advances",
  "Open Stock",
  "Other Liabilities",
  "Provisions",
  "Purchase A/C",
  "Purchase Return",
  "Salary A/C",
  "Sales A/C",
  "Sales Return",
  "Secure Loans",
  "Stock In Trade",
  "Sundry Creditors",
  "Sundry Debtors",
  "Unsecure Loans",
] as const;

export type AccountHeadOption = (typeof ACCOUNT_HEAD_OPTIONS)[number];


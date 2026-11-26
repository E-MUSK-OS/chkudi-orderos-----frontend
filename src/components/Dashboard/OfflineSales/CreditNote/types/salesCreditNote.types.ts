import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";

export interface SalesCreditNoteItem {
  id?: string;
  itemNo: number;
  sku: string;
  particular: string;
  refInvoiceNo?: string | null;
  size?: string | null;
  lotNo?: string | null;
  hsn?: string | null;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  discountPercent: number | string;
  discountAmount: number | string;
  taxableAmount: number | string;
  sgstRate: number | string;
  sgstAmount: number | string;
  cgstRate: number | string;
  cgstAmount: number | string;
  igstRate: number | string;
  igstAmount: number | string;
  total: number | string;
}

export interface SalesCreditNote {
  id: string;
  userId: string;
  partyId?: string | null;
  salesFor: string;
  invoiceType: string;
  creditNoteNo: string;
  creditNoteDate: string;
  partyGstn?: string | null;
  stateCode?: string | null;
  billingPartyName: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  billingMobile?: string | null;
  preparedBy?: string | null;
  remarks?: string | null;
  tdsPercent: number;
  tdsAmount: number;
  tcsPercent: number;
  tcsAmount: number;
  otherExpense: number;
  otherExpenses?: Array<{
    itemNo?: number;
    expenseName: string;
    amount: number | string;
  }> | null;
  totalQuantity: number;
  totalAmount: number;
  totalDiscount: number;
  amountBeforeTax: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  totalGst: number;
  amountAfterTax: number;
  roundOff: number;
  netAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: SalesCreditNoteItem[];
  party?: Party | null;
}

export interface SalesCreditNoteFormData {
  partyId?: string | null;
  salesFor: string;
  invoiceType: string;
  creditNoteNo: string;
  creditNoteDate: string;
  partyGstn?: string | null;
  stateCode?: string | null;
  billingPartyName: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  billingMobile?: string | null;
  preparedBy?: string | null;
  remarks?: string | null;
  tdsPercent: number;
  tdsAmount: number;
  tcsPercent: number;
  tcsAmount: number;
  otherExpense: number;
  otherExpenses?: Array<{
    itemNo?: number;
    expenseName: string;
    amount: number | string;
  }>;
  totalQuantity: number;
  totalAmount: number;
  totalDiscount: number;
  amountBeforeTax: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  totalGst: number;
  amountAfterTax: number;
  roundOff: number;
  netAmount: number;
  items: SalesCreditNoteItem[];
}

export interface CreditNoteFilterState {
  search: string;
  creditNoteNo: string;
  party: string;
  salesFor: string;
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

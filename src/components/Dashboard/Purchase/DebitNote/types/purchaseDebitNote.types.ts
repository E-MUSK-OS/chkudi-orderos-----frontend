import { Party } from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";

export interface PurchaseDebitNoteItem {
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

export interface PurchaseDebitNote {
  id: string;
  userId: string;
  supplierId?: string | null;
  debitNoteType: string;
  invoiceType: string;
  debitNoteNo: string;
  debitNoteDate: string;
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
  items: PurchaseDebitNoteItem[];
  supplier?: Party | null;
}

export interface PurchaseDebitNoteFormData {
  supplierId?: string | null;
  partyId?: string | null;
  debitNoteType: string;
  invoiceType: string;
  debitNoteNo: string;
  debitNoteDate: string;
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
  status?: string;
  items: PurchaseDebitNoteItem[];
}

export interface DebitNoteFilterState {
  search?: string;
  productSku?: string;
  lotNo?: string;
  party?: string;
  debitNoteNo?: string;
  invoiceType?: string;
  selectedSku?: string;
  startDate?: string;
  endDate?: string;
}

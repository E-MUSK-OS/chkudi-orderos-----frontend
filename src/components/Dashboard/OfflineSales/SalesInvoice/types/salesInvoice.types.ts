export interface SalesInvoiceItem {
  id?: string;
  itemNo: number;
  sku: string;
  particular: string;
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

export interface SalesInvoice {
  id: string;
  userId: string;
  challanId?: string | null;
  partyId?: string | null;

  invoiceType: string;
  invoiceNo: string;
  invoiceDate: string;
  challanNo?: string | null;
  challanDate?: string | null;
  partyGstn?: string | null;
  stateCode?: string | null;
  brokerName?: string | null;
  consigneeName?: string | null;
  editOn: boolean;

  remarks?: string | null;
  ewayBillNo?: string | null;
  expenseOnSales: number;
  hasReceipt: boolean;
  receivedAmount?: number | null;
  receiptMode?: string | null;
  receiptAccount?: string | null;
  transactionType?: string | null;
  transactionDate?: string | null;
  chequeNo?: string | null;
  bankName?: string | null;

  billingPartyName: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  billingEmail?: string | null;
  billingMobile?: string | null;

  shippingPartyName?: string | null;
  shippingAddress?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  shippingContact?: string | null;
  courierPartner?: string | null;
  trackingNo?: string | null;

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

  items: SalesInvoiceItem[];
  party?: any;
  challan?: any;
}

export interface SalesInvoiceFormData {
  invoiceType: string;
  invoiceNo: string;
  invoiceDate: string;
  challanId?: string | null;
  challanNo?: string | null;
  challanDate?: string | null;
  partyId?: string | null;
  partyGstn?: string | null;
  stateCode?: string | null;
  brokerName?: string | null;
  consigneeName?: string | null;
  editOn: boolean;

  remarks?: string | null;
  ewayBillNo?: string | null;
  expenseOnSales: number;
  hasReceipt: boolean;
  receivedAmount?: number | null;
  receiptMode?: string | null;
  receiptAccount?: string | null;
  transactionType?: string | null;
  transactionDate?: string | null;
  chequeNo?: string | null;
  bankName?: string | null;
  applyRoundOff?: boolean;

  billingPartyName: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  billingEmail?: string | null;
  billingMobile?: string | null;

  shippingPartyName?: string | null;
  shippingAddress?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  shippingContact?: string | null;
  courierPartner?: string | null;
  trackingNo?: string | null;

  totalQuantity?: number;
  totalAmount?: number;
  totalDiscount?: number;
  amountBeforeTax?: number;
  sgstAmount?: number;
  cgstAmount?: number;
  igstAmount?: number;
  totalGst?: number;
  amountAfterTax?: number;
  roundOff?: number;
  netAmount?: number;

  status?: string;
  items: SalesInvoiceItem[];
}

export interface SalesInvoiceFilterState {
  search?: string;
  invoiceNo?: string;
  challanNo?: string;
  challanRefNo?: string;
  partyName?: string;
  productSku?: string;
  startDate?: string;
  endDate?: string;
  invoiceType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export type CashVoucherEntryType =
  | "Payment"
  | "Advanced Payment"
  | "Receipt"
  | "Advance Receipt";

export interface CashBookOption {
  id: string;
  label: string;
  source: "party" | "default";
}

export interface CashVoucher {
  id: string;
  userId: string;
  entryType: CashVoucherEntryType;
  voucherNo: number;
  date: string;
  cashBookId?: string | null;
  cashBookName: string;
  partyId?: string | null;
  partyName: string;
  accountCode?: string | null;
  outstandingBalance: number;
  address?: string | null;
  groupName?: string | null;
  refNo?: string | null;
  narration?: string | null;
  amount: number;
  openingPayment: number;
  preparedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  party?: {
    id: string;
    partyName: string;
    gstin?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  } | null;
}

export interface CashVoucherFilterState {
  cashBook: string;
  party: string;
  voucherNo: string;
  entryType: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface CashVoucherListResponse {
  success: boolean;
  data: CashVoucher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalPaymentSum: number;
    totalReceiptSum: number;
  };
}

export interface CashVoucherFormData {
  entryType: CashVoucherEntryType | "";
  cashBookId: string;
  cashBookName: string;
  voucherNo: number | string;
  date: string;
  partyId: string;
  partyName: string;
  accountCode: string;
  outstandingBalance: number | string;
  address: string;
  amount: number | string;
  openingPayment: number | string;
  narration: string;
  refNo: string;
  groupName: string;
  preparedBy: string;
}

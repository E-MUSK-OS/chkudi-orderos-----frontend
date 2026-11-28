export type BankVoucherEntryType =
  | "Payment"
  | "Advanced Payment"
  | "Receipt"
  | "Advance Receipt";

export interface BankVoucher {
  id: string;
  userId: string;
  entryType: BankVoucherEntryType;
  voucherNo: number;
  date: string;
  bankBookId?: string | null;
  bankBookName: string;
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
  transactionType?: string | null;
  transactionNo?: string | null;
  transactionDate?: string | null;
  bankName?: string | null;
  beneficiary?: string | null;
  expenseOnTransaction: number;
  preparedBy?: string | null;
  salaryReportBatchId?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface BankBookOption {
  id: string;
  label: string;
  bankName: string;
  accountNumber: string;
  branchName?: string;
  ifscCode?: string;
  source?: string;
}

export interface BankVoucherFilterState {
  bankBook: string;
  party: string;
  voucherNo: string;
  entryType: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface BankVoucherFormData {
  entryType: BankVoucherEntryType | "";
  bankBookId: string;
  bankBookName: string;
  voucherNo: number | string;
  date: string;
  partyId: string;
  partyName: string;
  accountCode: string;
  outstandingBalance: number;
  address: string;
  amount: number | string;
  openingPayment: number | string;
  narration: string;
  refNo: string;
  groupName: string;
  transactionType: string;
  beneficiary: string;
  transactionNo: string;
  transactionDate: string;
  bankName: string;
  expenseOnTransaction: number | string;
  preparedBy: string;
}

export interface BankVoucherListResponse {
  items: BankVoucher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalPaymentSum: number;
  totalReceiptSum: number;
}

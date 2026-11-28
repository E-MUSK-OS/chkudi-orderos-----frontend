export interface JournalVoucher {
  id: string;
  userId: string;
  voucherNo: number;
  date: string;
  creditAccountId?: string | null;
  creditAccountName: string;
  debitAccountId?: string | null;
  debitAccountName: string;
  amount: number;
  narration?: string | null;
  refNo?: string | null;
  preparedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalVoucherFilterState {
  search: string;
  startDate: string;
  endDate: string;
}

export interface JournalVoucherFormData {
  voucherNo: number | string;
  date: string;
  creditAccountId: string;
  creditAccountName: string;
  debitAccountId: string;
  debitAccountName: string;
  amount: number | string;
  narration: string;
  refNo: string;
  preparedBy: string;
}

export interface JournalVoucherListResponse {
  items: JournalVoucher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmountSum: number;
}

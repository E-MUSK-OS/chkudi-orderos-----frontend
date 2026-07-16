export interface WalletSummary {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  totalTransactions: number;
}

export interface WalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  points: number;
  balanceAfter: number;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: WalletSummary;
}

export interface WalletHistoryResponse {
  success: boolean;
  message: string;
  data: {
    points: number;
    transactions: WalletTransaction[];
  };
}
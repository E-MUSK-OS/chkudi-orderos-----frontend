import { useCallback, useEffect, useState } from "react";

import { walletService } from "../services/wallet.service";
import type { WalletSummary, WalletTransaction } from "../types/wallet.types";

export const useWallet = (token: string) => {
  const [summary, setSummary] = useState<WalletSummary>({
    balance: 0,
    totalCredit: 0,
    totalDebit: 0,
    totalTransactions: 0,
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================
  // Fetch Wallet History & Summary
  // =====================================

  const fetchHistory = useCallback(async () => {
    try {
      const res = await walletService.getWalletHistory(token);

      const transactions = res.data.transactions;

      const totalCredit = transactions
        .filter((item) => item.type === "CREDIT")
        .reduce((sum, item) => sum + item.points, 0);

      const totalDebit = transactions
        .filter((item) => item.type === "DEBIT")
        .reduce((sum, item) => sum + item.points, 0);

      setTransactions(transactions);

      setSummary({
        balance: res.data.points,
        totalCredit,
        totalDebit,
        totalTransactions: transactions.length,
      });
    } catch (error: any) {
      setError(error.message);
    }
  }, [token]);

  // =====================================
  // Refetch
  // =====================================

  const refetch = useCallback(async () => {
    setLoading(true);

    await fetchHistory();

    setLoading(false);
  }, [fetchHistory]);

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token, refetch]);

  return {
    summary,
    transactions,
    loading,
    error,
    refetch,
  };
};
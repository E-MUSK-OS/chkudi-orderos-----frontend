import { api } from "../../../../services/api";

import type {
  WalletResponse,
  WalletHistoryResponse,
} from "../types/wallet.types";
import type { ApiResponse } from "@/services/auth/auth.types";

export const walletService = {
  // ============================
  // Get Wallet Summary
  // ============================

  getWallet(token: string) {
    return api.get<WalletResponse>("/wallet", token);
  },

  // ============================
  // Get Wallet History
  // ============================

  getWalletHistory(token: string) {
    return api.get<WalletHistoryResponse>("/wallet/history", token);
  },

  // ============================
  // Credit Wallet
  // ============================

  creditWallet(
    token: string,
    data: {
      points: number;
      description?: string;
      referenceId?: string;
    },
  ) {
    return api.post<ApiResponse>("/wallet/credit", data, token);
  },

  // ============================
  // Debit Wallet
  // ============================

  debitWallet(
    token: string,
    data: {
      points: number;
      description?: string;
      referenceId?: string;
    },
  ) {
    return api.post<ApiResponse>("/wallet/debit", data, token);
  },
};

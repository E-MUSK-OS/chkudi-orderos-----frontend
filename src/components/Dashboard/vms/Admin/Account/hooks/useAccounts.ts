"use client";

import { useState } from "react";

import {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "../types/account";

import {
  getAccounts,
  createAccount as createAccountApi,
  updateAccount as updateAccountApi,
  deleteAccount as deleteAccountApi,
} from "../services/account.service";

export const useAccounts = () => {
  // ======================================================
  // State
  // ======================================================

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<Account | null>(null);

  const [loading, setLoading] = useState(false);

  // ======================================================
  // Get All Accounts
  // ======================================================

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      const response = await getAccounts();

      setAccounts(response.data);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Create Account
  // ======================================================

  const createAccount = async (
    data: CreateAccountPayload
  ) => {
    setLoading(true);

    try {
      await createAccountApi(data);

      await fetchAccounts();
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Update Account
  // ======================================================

  const updateAccount = async (
    id: string,
    data: UpdateAccountPayload
  ) => {
    setLoading(true);

    try {
      await updateAccountApi(id, data);

      await fetchAccounts();
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Delete Account
  // ======================================================

  const deleteAccount = async (id: string) => {
    setLoading(true);

    try {
      await deleteAccountApi(id);

      await fetchAccounts();
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Return
  // ======================================================

  return {
    accounts,
    setAccounts,

    selectedAccount,
    setSelectedAccount,

    loading,
    setLoading,

    fetchAccounts,

    createAccount,

    updateAccount,

    deleteAccount,
  };
};
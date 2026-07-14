import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

import {
  CreateAccountPayload,
  UpdateAccountPayload,
  AccountResponse,
  AccountsResponse,
} from "../types/account";

const BASE_URL = `${API_BASE_URL}/accounts`;

// ======================================================
// Get All Accounts
// ======================================================

export const getAccounts = async (): Promise<AccountsResponse> => {
  const response = await fetchWithAuth(BASE_URL, {
    method: "GET",
  });

  const data: AccountsResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch accounts.");
  }

  return data;
};

// ======================================================
// Get Account By Id
// ======================================================

export const getAccountById = async (
  id: string
): Promise<AccountResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "GET",
  });

  const data: AccountResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch account.");
  }

  return data;
};

// ======================================================
// Create Account
// ======================================================

export const createAccount = async (
  payload: CreateAccountPayload
): Promise<AccountResponse> => {
  const response = await fetchWithAuth(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data: AccountResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create account.");
  }

  return data;
};

// ======================================================
// Update Account
// ======================================================

export const updateAccount = async (
  id: string,
  payload: UpdateAccountPayload
): Promise<AccountResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const data: AccountResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update account.");
  }

  return data;
};

// ======================================================
// Delete Account
// ======================================================

export const deleteAccount = async (
  id: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete account.");
  }

  return data;
};
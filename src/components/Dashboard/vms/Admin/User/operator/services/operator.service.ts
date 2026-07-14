import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

import {
  CreateOperatorPayload,
  UpdateOperatorPayload,
  OperatorResponse,
  OperatorsResponse,
} from "../types/operator";

const BASE_URL = `${API_BASE_URL}/operators`;

// ======================================================
// Get All Operators
// ======================================================

export const getOperators = async (): Promise<OperatorsResponse> => {
  const response = await fetchWithAuth(BASE_URL, {
    method: "GET",
  });

  const data: OperatorsResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch operators.");
  }

  return data;
};

// ======================================================
// Get Operator By Id
// ======================================================

export const getOperatorById = async (
  id: string
): Promise<OperatorResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "GET",
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch operator.");
  }

  return data;
};

// ======================================================
// Create Operator
// ======================================================

export const createOperator = async (
  payload: CreateOperatorPayload
): Promise<OperatorResponse> => {
  const response = await fetchWithAuth(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create operator.");
  }

  return data;
};

// ======================================================
// Update Operator
// ======================================================

export const updateOperator = async (
  id: string,
  payload: UpdateOperatorPayload
): Promise<OperatorResponse> => {
  const response = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update operator.");
  }

  return data;
};

// ======================================================
// Delete Operator
// ======================================================

export const deleteOperator = async (
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
    throw new Error(data.message || "Failed to delete operator.");
  }

  return data;
};
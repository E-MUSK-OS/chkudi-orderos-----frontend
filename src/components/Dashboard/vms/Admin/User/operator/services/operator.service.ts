import { API_BASE_URL } from "@/lib/config";
import {
  CreateOperatorPayload,
  UpdateOperatorPayload,
  OperatorResponse,
  OperatorsResponse,
} from "../types/operator";

const BASE_URL = `${API_BASE_URL}/operators`;

// const BASE_URL = "https://chkudi-orderos-backend.vercel.app/api/v1/operators";
// const BASE_URL = "http://localhost:5000/api/v1/operators";

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ======================================================
// Get All Operators
// ======================================================

export const getOperators = async (): Promise<OperatorsResponse> => {
  const response = await fetch(BASE_URL, {
    method: "GET",
    headers: getHeaders(),
  });

  const data: OperatorsResponse = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch operators.");
  }

  return data;
};

// ======================================================
// Get Operator By Id
// ======================================================

export const getOperatorById = async (
  id: string
): Promise<OperatorResponse> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch operator.");
  }

  return data;
};

// ======================================================
// Create Operator
// ======================================================

export const createOperator = async (
  payload: CreateOperatorPayload
): Promise<OperatorResponse> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
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
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
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
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete operator.");
  }

  return data;
};
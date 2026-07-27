import { api } from "@/services/api";

import type {
  InventoryFilters,
  InventoryListResponse,
  InventoryResponse,
  UpdateInventoryPayload,
  AdjustInventoryPayload,
  ImportInventoryResponse,
} from "../types/inventory.types";

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

// ==================================================================================
// ============================== QUERY STRING ======================================
// ==================================================================================

const buildQueryString = (filters: InventoryFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  return params.toString();
};

// ==================================================================================
// ============================== GET INVENTORIES ===================================
// ==================================================================================

export const getInventories = async (
  filters: InventoryFilters = {},
  token: string,
): Promise<InventoryListResponse> => {
  const query = buildQueryString(filters);

  return api.get<InventoryListResponse>(
    `/inventories${query ? `?${query}` : ""}`,
    token,
  );
};

// ==================================================================================
// =========================== GET INVENTORY BY ID ==================================
// ==================================================================================

export const getInventoryById = async (
  id: string,
  token: string,
): Promise<InventoryResponse> => {
  return api.get<InventoryResponse>(`/inventories/${id}`, token);
};

// ==================================================================================
// ============================= UPDATE INVENTORY ===================================
// ==================================================================================

export const updateInventory = async (
  id: string,
  payload: UpdateInventoryPayload,
  token: string,
): Promise<InventoryResponse> => {
  return api.patch<InventoryResponse>(`/inventories/${id}`, payload, token);
};

// ==================================================================================
// ============================= ADJUST INVENTORY ===================================
// ==================================================================================

export const adjustInventory = async (
  id: string,
  payload: AdjustInventoryPayload,
  token: string,
): Promise<InventoryResponse> => {
  return api.patch<InventoryResponse>(
    `/inventories/${id}/adjust`,
    payload,
    token,
  );
};

// ==================================================================================
// ============================= DELETE INVENTORY ===================================
// ==================================================================================

export const deleteInventory = async (
  id: string,
  token: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  return api.delete(`/inventories/${id}`, token);
};

export const exportInventory = async (token: string): Promise<void> => {
  const blob = await api.download("/inventories/export", token);

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `Inventory-${new Date().toISOString().split("T")[0]}.xlsx`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};

export const importInventory = async (
  file: File,
  token: string,
): Promise<ImportInventoryResponse> => {
  const formData = new FormData();

  formData.append("file", file);

  return api.post<ImportInventoryResponse>(
    "/inventories/import",
    formData,
    token,
  );
};

import { api } from "@/services/api";
import type {
  MyntraImportsResponse,
  MyntraMappingsResponse,
} from "../types/myntraImport.types";

const BASE_URL = "/myntra-imports";

/**
 * Upload Myntra Import Excel file
 * Sends multipart/form-data to /myntra-imports/excel
 */
export async function uploadMyntraImportExcel(file: File, token?: string) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<{ success: boolean; message: string; data?: any }>(
    `${BASE_URL}/excel`,
    formData,
    token
  );
}

/**
 * Get all Myntra mappings as a dictionary for O(1) picklist lookup
 */
export async function getAllMyntraMappings(token?: string) {
  return api.get<MyntraMappingsResponse>(`${BASE_URL}/all`, token);
}

/**
 * Get paginated Myntra imports
 */
export async function getMyntraImports(
  params?: { page?: number; limit?: number; search?: string },
  token?: string
) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));
  if (params?.search) searchParams.append("search", params.search);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return api.get<MyntraImportsResponse>(`${BASE_URL}${query}`, token);
}

/**
 * Delete a Myntra import record
 */
export async function deleteMyntraImport(id: string, token?: string) {
  return api.delete<{ success: boolean; message: string }>(
    `${BASE_URL}/${id}`,
    token
  );
}

/**
 * Clear all Myntra import records
 */
export async function clearAllMyntraImports(token?: string) {
  return api.delete<{ success: boolean; message: string }>(
    `${BASE_URL}/clear-all`,
    token
  );
}

/**
 * Create single Myntra import record
 */
export async function createMyntraImport(
  data: {
    myntraSku: string;
    sellerSku?: string;
    generateBarcode?: string;
    generatedBarcode?: string;
    rackAddress?: string;
  },
  token?: string
) {
  return api.post<{ success: boolean; message: string; data?: any }>(
    BASE_URL,
    data,
    token
  );
}

/**
 * Update single Myntra import record
 */
export async function updateMyntraImport(
  id: string,
  data: {
    myntraSku?: string;
    sellerSku?: string;
    generateBarcode?: string;
    generatedBarcode?: string;
    rackAddress?: string;
  },
  token?: string
) {
  return api.put<{ success: boolean; message: string }>(
    `${BASE_URL}/${id}`,
    data,
    token
  );
}

export const myntraImportService = {
  create: createMyntraImport,
  update: updateMyntraImport,
  uploadMyntraImportExcel,
  getAllMyntraMappings,
  getMyntraImports,
  delete: deleteMyntraImport,
  clearAll: clearAllMyntraImports,
};

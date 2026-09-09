import { api } from "@/services/api";
import type { AsinImportsResponse } from "../types/asinImport.types";

const BASE_URL = "/asin-imports";

export const asinImportService = {
  /**
   * Get all ASIN imports
   */
  getAll(search?: string, token?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<AsinImportsResponse>(`${BASE_URL}${query}`, token);
  },

  /**
   * Import ASIN from Excel
   */
  importExcel(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ success: boolean; message: string; data?: any }>(
      `${BASE_URL}/import-excel`,
      formData,
      token,
    );
  },

  /**
   * Delete ASIN import by ID
   */
  delete(id: string, token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Update ASIN import by ID
   */
  update(
    id: string,
    data: { asin?: string; sku?: string; generateBarcode?: string; rackAddress?: string },
    token?: string,
  ) {
    return api.put<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`,
      data,
      token,
    );
  },

  /**
   * Clear all ASIN imports
   */
  clearAll(token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/clear-all`,
      token,
    );
  },
};


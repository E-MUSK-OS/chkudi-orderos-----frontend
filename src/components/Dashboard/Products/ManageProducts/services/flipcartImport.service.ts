import { api } from "@/services/api";
import type { FlipcartImportsResponse } from "../types/flipcartImport.types";

const BASE_URL = "/flipcart-imports";

export const flipcartImportService = {
  /**
   * Fast batch resolution of SKUs across FlipcartImports, Products, and ProductVariants
   */
  resolveSkus(skus: string[], token?: string) {
    return api.post<{
      success: boolean;
      data: Array<{ fsn?: string; asin?: string; sku?: string; rackAddress?: string }>;
      count: number;
    }>(`${BASE_URL}/resolve-skus`, { skus }, token);
  },

  /**
   * Get all Flipcart imports
   */
  getAll(search?: string, token?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<FlipcartImportsResponse>(`${BASE_URL}${query}`, token);
  },

  /**
   * Create single Flipcart import
   */
  create(
    data: { fsn: string; sku?: string; rackAddress?: string },
    token?: string
  ) {
    return api.post<{ success: boolean; message: string; data?: any }>(
      BASE_URL,
      data,
      token
    );
  },

  /**
   * Import Flipcart from Excel
   */
  importExcel(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ success: boolean; message: string; data?: any }>(
      `${BASE_URL}/import-excel`,
      formData,
      token
    );
  },

  /**
   * Delete Flipcart import by ID
   */
  delete(id: string, token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`,
      token
    );
  },

  /**
   * Update Flipcart import by ID
   */
  update(
    id: string,
    data: { fsn?: string; sku?: string; rackAddress?: string },
    token?: string
  ) {
    return api.put<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`,
      data,
      token
    );
  },

  /**
   * Clear all Flipcart imports
   */
  clearAll(token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/clear-all`,
      token
    );
  },
};

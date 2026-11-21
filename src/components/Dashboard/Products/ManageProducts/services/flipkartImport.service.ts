import { api } from "@/services/api";
import type { FlipkartImportsResponse } from "../types/flipkartImport.types";

const BASE_URL = "/flipkart-imports";

export const flipkartImportService = {
  /**
   * Fast batch resolution of SKUs across FlipkartImports, Products, and ProductVariants
   */
  resolveSkus(skus: string[], token?: string) {
    return api.post<{
      success: boolean;
      data: Array<{ fsn?: string; asin?: string; sku?: string; rackAddress?: string }>;
      count: number;
    }>(`${BASE_URL}/resolve-skus`, { skus }, token);
  },

  /**
   * Get all Flipkart imports
   */
  getAll(search?: string, token?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<FlipkartImportsResponse>(`${BASE_URL}${query}`, token);
  },

  /**
   * Create single Flipkart import
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
   * Import Flipkart from Excel
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
   * Delete Flipkart import by ID
   */
  delete(id: string, token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/${id}`,
      token
    );
  },

  /**
   * Update Flipkart import by ID
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
   * Clear all Flipkart imports
   */
  clearAll(token?: string) {
    return api.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/clear-all`,
      token
    );
  },
};

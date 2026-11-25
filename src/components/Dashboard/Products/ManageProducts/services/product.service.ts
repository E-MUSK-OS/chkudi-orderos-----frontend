import { api } from "@/services/api";

import type {
  CreateProductPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
  ProductResponse,
  ProductsResponse,
  ProductStatsResponse,
  DropdownOptionsResponse,
  DropdownOptionItem,
} from "../types/product.types";

const BASE_URL = "/products";

export const productService = {
  /**
   * Get All Products
   */
  getAll(token?: string) {
    return api.get<ProductsResponse>(BASE_URL, token);
  },

  /**
   * Get All Products for Product Gallery (Offline Sales)
   */
  getGallery(token?: string) {
    return api.get<ProductsResponse>(`${BASE_URL}/gallery`, token);
  },

  /**
   * Batch Revise Retail Rate (RR) & Dealer Rate (DR)
   */
  revisePrices(
    items: Array<{ productId: string; retailRate?: number; dealerRate?: number }>,
    token?: string
  ) {
    return api.patch<{
      success: boolean;
      message: string;
      data: { updatedCount: number };
    }>(`${BASE_URL}/revise-prices`, { items }, token);
  },

  /**
   * Get Product By Id
   */
  getById(id: string, token?: string) {
    return api.get<ProductResponse>(`${BASE_URL}/${id}`, token);
  },

  /**
   * Get Product Stats
   */
  getStats(token?: string) {
    return api.get<ProductStatsResponse>(
      `${BASE_URL}/stats`,
      token,
    );
  },

  /**
   * Create Product
   */
  create(
    data: CreateProductPayload,
    token?: string,
  ) {
    return api.post<ProductResponse>(
      BASE_URL,
      data,
      token,
    );
  },

  /**
   * Update Product
   */
  update(
    id: string,
    data: UpdateProductPayload,
    token?: string,
  ) {
    return api.put<ProductResponse>(
      `${BASE_URL}/${id}`,
      data,
      token,
    );
  },

  /**
   * Delete Product
   */
  delete(id: string, token?: string) {
    return api.delete<ProductResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Update Product Status
   */
  updateStatus(
    id: string,
    data: UpdateProductStatusPayload,
    token?: string,
  ) {
    return api.patch<ProductResponse>(
      `${BASE_URL}/${id}/status`,
      data,
      token,
    );
  },

  /**
   * Import Products From Excel
   */
  importExcel(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ success: boolean; message: string; data?: unknown }>(
      `${BASE_URL}/import-excel`,
      formData,
      token,
    );
  },
  getDropdownOptions(token?: string) {
    return api.get<DropdownOptionsResponse>(`${BASE_URL}/dropdown-options`, token);
  },

  saveDropdownOption(
    data: { field: string; value: string; label?: string },
    token?: string,
  ) {
    return api.post<{ success: boolean; data: DropdownOptionItem }>(
      `${BASE_URL}/dropdown-options`,
      data,
      token,
    );
  },

  uploadProductImage(
    formData: FormData,
    token?: string
  ) {
    return api.post<{
      success: boolean;
      message: string;
      data: {
        masterSku: string;
        color: string;
        fileName: string;
        imageUrl: string;
        primaryImageUrl?: string;
        imgfileurl?: string;
      };
    }>(`${BASE_URL}/upload-image`, formData, token);
  },

  getProductImages(masterSku: string, token?: string) {
    return api.get<{
      success: boolean;
      data: Record<string, string>;
      gallery?: Record<
        string,
        Array<{
          fileName: string;
          color: string;
          angle: string;
          url: string;
        }>
      >;
    }>(`${BASE_URL}/images?masterSku=${encodeURIComponent(masterSku)}`, token);
  },

  deleteProductImage(
    masterSku: string,
    color: string,
    filename?: string,
    token?: string
  ) {
    let url = `${BASE_URL}/image?masterSku=${encodeURIComponent(masterSku)}&color=${encodeURIComponent(color)}`;
    if (filename) {
      url += `&filename=${encodeURIComponent(filename)}`;
    }
    return api.delete<{
      success: boolean;
      message: string;
    }>(url, token);
  },

  reorderProductImages(
    masterSku: string,
    color: string,
    fileNames: string[],
    token?: string
  ) {
    return api.post<{
      success: boolean;
      message: string;
      data: {
        masterSku: string;
        color: string;
        primaryImageUrl: string;
        gallery: Array<{
          fileName: string;
          color: string;
          angle: string;
          url: string;
        }>;
      };
    }>(`${BASE_URL}/reorder-images`, { masterSku, color, fileNames }, token);
  },
};

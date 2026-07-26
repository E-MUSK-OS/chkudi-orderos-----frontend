import { api } from "@/services/api";

import type {
  CreateProductPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
  ProductResponse,
  ProductsResponse,
  ProductStatsResponse,
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
};
import { api } from "@/services/api";

import type {
  CreateProductVariantPayload,
  UpdateProductVariantPayload,
  ProductVariantResponse,
  ProductVariantsResponse,
} from "../types/productVariant.types";

const BASE_URL = "/product-variants";

export const productVariantService = {
  /**
   * Get All Product Variants
   */
  getAll(token?: string) {
    return api.get<ProductVariantsResponse>(
      BASE_URL,
      token,
    );
  },

  /**
   * Get Product Variants By Product Id
   */
  getByProductId(
    productId: string,
    token?: string,
  ) {
    return api.get<ProductVariantsResponse>(
      `${BASE_URL}/product/${productId}`,
      token,
    );
  },

  /**
   * Get Product Variant By Id
   */
  getById(id: string, token?: string) {
    return api.get<ProductVariantResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Create Product Variant
   */
  create(
    data: CreateProductVariantPayload,
    token?: string,
  ) {
    return api.post<ProductVariantResponse>(
      BASE_URL,
      data,
      token,
    );
  },

  /**
   * Update Product Variant
   */
  update(
    id: string,
    data: UpdateProductVariantPayload,
    token?: string,
  ) {
    return api.put<ProductVariantResponse>(
      `${BASE_URL}/${id}`,
      data,
      token,
    );
  },

  /**
   * Delete Product Variant
   */
  delete(id: string, token?: string) {
    return api.delete<ProductVariantResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Update Product Variant Status
   */
  updateStatus(
    id: string,
    data: { isActive: boolean },
    token?: string,
  ) {
    return api.patch<ProductVariantResponse>(
      `${BASE_URL}/${id}/status`,
      data,
      token,
    );
  },
};
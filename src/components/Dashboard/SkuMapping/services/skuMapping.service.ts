import { api } from "@/services/api";

import type {
  ImportSkuMappingResponse,
  SkuMappingResponse,
  SkuMappingsResponse,
  UpdateSkuMappingPayload,
} from "../types/skuMapping.types";

const BASE_URL = "/sku-mappings";

export const skuMappingService = {
  /**
   * Get All SKU Mappings
   */
  getAll(params?: Record<string, string | number | undefined>, token?: string) {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();

    return api.get<SkuMappingsResponse>(
      query ? `${BASE_URL}?${query}` : BASE_URL,
      token,
    );
  },

  /**
   * Get SKU Mapping By Id
   */
  getById(id: string, token?: string) {
    return api.get<SkuMappingResponse>(`${BASE_URL}/${id}`, token);
  },

  /**
   * Search Short SKU
   */
  search(shortSku: string, token?: string) {
    return api.get<SkuMappingResponse>(
      `${BASE_URL}/search?shortSku=${encodeURIComponent(shortSku)}`,
      token,
    );
  },

  /**
   * Short SKU Suggestions
   */
  suggestions(query: string, token?: string) {
    return api.get<{
      success: boolean;
      data: {
        id: string;
        shortSku: string;
      }[];
    }>(`${BASE_URL}/suggestions?q=${encodeURIComponent(query)}`, token);
  },

  /**
   * Update SKU Mapping
   */
  update(id: string, data: UpdateSkuMappingPayload, token?: string) {
    return api.put<SkuMappingResponse>(`${BASE_URL}/${id}`, data, token);
  },

  /**
   * Delete SKU Mapping
   */
  delete(id: string, token?: string) {
    return api.delete<SkuMappingResponse>(`${BASE_URL}/${id}`, token);
  },

  /**
   * Import SKU Mapping Excel
   */
  import(file: File, token?: string) {
    const formData = new FormData();

    formData.append("file", file);

    return api.post<ImportSkuMappingResponse>(
      `${BASE_URL}/import`,
      formData,
      token,
    );
  },
};

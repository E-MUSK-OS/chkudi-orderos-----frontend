import { api } from "@/services/api";

import type {
  CreateMaterialPayload,
  UpdateMaterialPayload,
  UpdateMaterialStatusPayload,
  MaterialResponse,
  MaterialsResponse,
  MaterialStatsResponse,
  DropdownOptionsResponse,
  DropdownOptionItem,
} from "../types/material.types";

const BASE_URL = "/materials";

export const materialService = {
  /**
   * Get All Materials
   */
  getAll(token?: string) {
    return api.get<MaterialsResponse>(BASE_URL, token);
  },

  /**
   * Get Material By Id
   */
  getById(id: string, token?: string) {
    return api.get<MaterialResponse>(`${BASE_URL}/${id}`, token);
  },

  /**
   * Get Material Stats
   */
  getStats(token?: string) {
    return api.get<MaterialStatsResponse>(
      `${BASE_URL}/stats`,
      token,
    );
  },

  /**
   * Create Material
   */
  create(
    data: CreateMaterialPayload,
    token?: string,
  ) {
    return api.post<MaterialResponse>(
      BASE_URL,
      data,
      token,
    );
  },

  /**
   * Update Material
   */
  update(
    id: string,
    data: UpdateMaterialPayload,
    token?: string,
  ) {
    return api.put<MaterialResponse>(
      `${BASE_URL}/${id}`,
      data,
      token,
    );
  },

  /**
   * Delete Material
   */
  delete(id: string, token?: string) {
    return api.delete<MaterialResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Update Material Status
   */
  updateStatus(
    id: string,
    data: UpdateMaterialStatusPayload,
    token?: string,
  ) {
    return api.patch<MaterialResponse>(
      `${BASE_URL}/${id}/status`,
      data,
      token,
    );
  },

  /**
   * Import Materials From Excel
   */
  importExcel(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<{
      success: boolean;
      message: string;
      data?: any;
    }>(`${BASE_URL}/import-excel`, formData, token);
  },

  /**
   * Dropdown Options
   */
  getDropdownOptions(token?: string) {
    return api.get<DropdownOptionsResponse>(
      `${BASE_URL}/dropdown-options`,
      token,
    );
  },

  saveDropdownOption(
    data: { field: string; value: string; label?: string },
    token?: string,
  ) {
    return api.post<{ success: boolean; message: string; data: DropdownOptionItem }>(
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
        imgfileurl?: string;
      };
    }>(`${BASE_URL}/upload-image`, formData, token);
  },

  getProductImages(masterSku: string, token?: string) {
    return api.get<{
      success: boolean;
      data: Record<string, string>;
    }>(`${BASE_URL}/images?masterSku=${encodeURIComponent(masterSku)}`, token);
  },
};


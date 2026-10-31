import { api } from "@/services/api";

import type {
  CreateMaterialVariantPayload,
  UpdateMaterialVariantPayload,
  MaterialVariantResponse,
  MaterialVariantsResponse,
} from "../types/materialVariant.types";

const BASE_URL = "/material-variants";

export const materialVariantService = {
  /**
   * Get All Material Variants
   */
  getAll(token?: string) {
    return api.get<MaterialVariantsResponse>(
      BASE_URL,
      token,
    );
  },

  /**
   * Get Material Variants By Material Id
   */
  getByMaterialId(
    materialId: string,
    token?: string,
  ) {
    return api.get<MaterialVariantsResponse>(
      `${BASE_URL}/material/${materialId}`,
      token,
    );
  },

  /**
   * Get Material Variant By Id
   */
  getById(id: string, token?: string) {
    return api.get<MaterialVariantResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Create Material Variant
   */
  create(
    data: CreateMaterialVariantPayload,
    token?: string,
  ) {
    return api.post<MaterialVariantResponse>(
      BASE_URL,
      data,
      token,
    );
  },

  /**
   * Update Material Variant
   */
  update(
    id: string,
    data: UpdateMaterialVariantPayload,
    token?: string,
  ) {
    return api.put<MaterialVariantResponse>(
      `${BASE_URL}/${id}`,
      data,
      token,
    );
  },

  /**
   * Delete Material Variant
   */
  delete(id: string, token?: string) {
    return api.delete<MaterialVariantResponse>(
      `${BASE_URL}/${id}`,
      token,
    );
  },

  /**
   * Update Material Variant Status
   */
  updateStatus(
    id: string,
    isActive: boolean,
    token?: string,
  ) {
    return api.patch<MaterialVariantResponse>(
      `${BASE_URL}/${id}/status`,
      { isActive },
      token,
    );
  },
};


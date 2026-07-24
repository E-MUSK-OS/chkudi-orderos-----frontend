import { api } from "@/services/api";

import type {
  CreateWarehousePayload,
  UpdateWarehousePayload,
  UpdateWarehouseStatusPayload,
  WarehouseResponse,
  WarehousesResponse,
  WarehouseStatsResponse,
} from "../types/warehouse.types";

const BASE_URL = "/warehouses";

export const warehouseService = {
  /**
   * Get All Warehouses
   */
  getAll(token?: string) {
    return api.get<WarehousesResponse>(BASE_URL, token);
  },

  /**
   * Get Warehouse By Id
   */
  getById(id: string, token?: string) {
    return api.get<WarehouseResponse>(`${BASE_URL}/${id}`, token);
  },

  getStats(token?: string) {
    return api.get<WarehouseStatsResponse>(`${BASE_URL}/stats`, token);
  },

  /**
   * Create Warehouse
   */
  create(data: CreateWarehousePayload, token?: string) {
    return api.post<WarehouseResponse>(BASE_URL, data, token);
  },

  /**
   * Update Warehouse
   */
  update(id: string, data: UpdateWarehousePayload, token?: string) {
    return api.put<WarehouseResponse>(`${BASE_URL}/${id}`, data, token);
  },

  /**
   * Delete Warehouse
   */
  delete(id: string, token?: string) {
    return api.delete<WarehouseResponse>(`${BASE_URL}/${id}`, token);
  },

  /**
   * Update Warehouse Status
   */
  updateStatus(id: string, data: UpdateWarehouseStatusPayload, token?: string) {
    return api.patch<WarehouseResponse>(
      `${BASE_URL}/${id}/status`,
      data,
      token,
    );
  },
};

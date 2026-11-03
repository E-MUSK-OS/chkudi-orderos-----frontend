import { api } from "@/services/api";
import {
  FieldGroup,
  SettingOptionItem,
  CreateOptionPayload,
  UpdateOptionPayload,
} from "../types/settingMasters.types";
import { INITIAL_FIELD_GROUPS } from "../constants/settingMasters.constants";

const BASE_URL = "/setting-masters";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const settingMastersService = {
  /**
   * Fetch all dynamic field groups (with local fallback)
   */
  async getFieldGroups(): Promise<FieldGroup[]> {
    try {
      const response = await api.get<ApiResponse<FieldGroup[]>>(`${BASE_URL}/groups`);
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn("Could not fetch field groups from server, using local fallback:", err);
    }
    return INITIAL_FIELD_GROUPS;
  },

  /**
   * Seed all Setting Master default values in database
   */
  async seedDefaults(force = false): Promise<void> {
    try {
      await api.post(`${BASE_URL}/seed-defaults`, { force });
    } catch (err) {
      console.warn("Could not seed defaults:", err);
    }
  },

  /**
   * Fetch all options for a specific field group
   */
  async getFieldOptions(field: string): Promise<SettingOptionItem[]> {
    try {
      const response = await api.get<ApiResponse<SettingOptionItem[]>>(
        `${BASE_URL}?field=${encodeURIComponent(field)}`
      );
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn(`Could not fetch options for ${field} from server:`, err);
    }
    return [];
  },

  /**
   * Add a new option to a group
   */
  async createOption(payload: CreateOptionPayload): Promise<SettingOptionItem> {
    const response = await api.post<ApiResponse<SettingOptionItem>>(BASE_URL, payload);
    return response.data;
  },

  /**
   * Update an existing option
   */
  async updateOption(id: string, payload: UpdateOptionPayload): Promise<SettingOptionItem> {
    const response = await api.put<ApiResponse<SettingOptionItem>>(`${BASE_URL}/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle option isActive state
   */
  async toggleOptionActive(
    id: string,
    payload: { field: string; value: string; isActive: boolean }
  ): Promise<SettingOptionItem> {
    const response = await api.patch<ApiResponse<SettingOptionItem>>(
      `${BASE_URL}/${id}/toggle`,
      payload
    );
    return response.data;
  },

  /**
   * Delete or deactivate an option
   */
  async deleteOption(
    id: string,
    payload: { field: string; value: string; label?: string }
  ): Promise<void> {
    const params: Record<string, string> = {
      field: payload.field,
      value: payload.value,
    };
    if (payload.label) params.label = payload.label;
    const query = new URLSearchParams(params).toString();
    await api.delete(`${BASE_URL}/${id}?${query}`);
  },
};

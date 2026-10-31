import { api } from "@/services/api";
import type { ManagedUser, UserFormValues } from "../types/userManagement.types";

const BASE_URL = "/manage-users";

export interface UsersResponse {
  success: boolean;
  message: string;
  data: ManagedUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: ManagedUser;
}

export interface UploadPhotoResponse {
  success: boolean;
  message: string;
  secure_url: string;
}

export const userManagementService = {
  getUsers(params?: { search?: string; sort?: string; page?: number; limit?: number }, token?: string) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get<UsersResponse>(`${BASE_URL}${qs}`, token);
  },

  getById(id: string, token?: string) {
    return api.get<UserResponse>(`${BASE_URL}/${id}`, token);
  },

  create(data: Partial<UserFormValues>, token?: string) {
    return api.post<UserResponse>(BASE_URL, data, token);
  },

  update(id: string, data: Partial<UserFormValues>, token?: string) {
    return api.patch<UserResponse>(`${BASE_URL}/${id}`, data, token);
  },

  updateStatus(id: string, isActive: boolean, token?: string) {
    return api.patch<UserResponse>(`${BASE_URL}/${id}/status`, { isActive }, token);
  },

  deleteUser(id: string, token?: string) {
    return api.delete<{ success: boolean; message: string }>(`${BASE_URL}/${id}`, token);
  },

  async uploadPhoto(file: File, token?: string, userNames?: { firstName?: string; middleName?: string; lastName?: string }) {
    const formData = new FormData();
    formData.append("file", file);
    if (userNames?.firstName) formData.append("firstName", userNames.firstName);
    if (userNames?.middleName) formData.append("middleName", userNames.middleName);
    if (userNames?.lastName) formData.append("lastName", userNames.lastName);
    return api.post<UploadPhotoResponse>(`${BASE_URL}/upload-photo`, formData, token);
  },

  getDropdownOptions(token?: string) {
    return api.get<{
      success: boolean;
      message: string;
      data: {
        savedOptions: Array<{ id: string; field: string; value: string; label: string }>;
        departments: string[];
        companies: string[];
        genders: string[];
      };
    }>(`${BASE_URL}/dropdown-options`, token);
  },

  saveDropdownOption(data: { field: string; value: string; label?: string }, token?: string) {
    return api.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`${BASE_URL}/dropdown-options`, data, token);
  },
};


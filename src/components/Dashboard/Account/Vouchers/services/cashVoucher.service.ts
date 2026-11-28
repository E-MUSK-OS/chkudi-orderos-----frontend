import axiosInstance from "@/services/axios";
import type {
  CashBookOption,
  CashVoucher,
  CashVoucherFilterState,
  CashVoucherListResponse,
} from "../types/cashVoucher.types";

const BASE_URL = "/cash-vouchers";

export const cashVoucherService = {
  async list(
    params: Partial<CashVoucherFilterState> & {
      page?: number;
      limit?: number;
      sortField?: string;
      sortAsc?: boolean;
    }
  ): Promise<CashVoucherListResponse> {
    const { data } = await axiosInstance.get(BASE_URL, { params });
    return data;
  },

  async getById(id: string): Promise<CashVoucher> {
    const { data } = await axiosInstance.get(`${BASE_URL}/${id}`);
    return data.data;
  },

  async getNextVoucherNo(entryType = "Payment"): Promise<number> {
    const { data } = await axiosInstance.get(`${BASE_URL}/next-no`, {
      params: { entryType },
    });
    return data?.data?.nextVoucherNo || 1;
  },

  async getCashBooks(): Promise<CashBookOption[]> {
    const { data } = await axiosInstance.get(`${BASE_URL}/cash-books`);
    return data?.data || [];
  },

  async create(payload: Record<string, any>): Promise<CashVoucher> {
    const { data } = await axiosInstance.post(BASE_URL, payload);
    return data.data;
  },

  async update(id: string, payload: Record<string, any>): Promise<CashVoucher> {
    const { data } = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  async exportExcel(params: Partial<CashVoucherFilterState>): Promise<Blob> {
    const { data } = await axiosInstance.get(`${BASE_URL}/export`, {
      params,
      responseType: "blob",
    });
    return data;
  },
};

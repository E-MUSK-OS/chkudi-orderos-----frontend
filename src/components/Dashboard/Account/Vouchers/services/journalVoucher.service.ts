import axiosInstance from "@/services/axios";
import type {
  JournalVoucher,
  JournalVoucherFilterState,
  JournalVoucherFormData,
  JournalVoucherListResponse,
} from "../types/journalVoucher.types";

export const journalVoucherService = {
  async list(
    params: Partial<JournalVoucherFilterState> & {
      page?: number;
      limit?: number;
      sortField?: string;
      sortAsc?: boolean;
    }
  ): Promise<JournalVoucherListResponse> {
    const { data } = await axiosInstance.get("/journal-vouchers", { params });
    return {
      items: data.data || [],
      total: data.meta?.total ?? 0,
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 10,
      totalPages: data.meta?.totalPages ?? 1,
      totalAmountSum: data.meta?.totalAmountSum ?? 0,
    };
  },

  async getById(id: string): Promise<JournalVoucher> {
    const { data } = await axiosInstance.get(`/journal-vouchers/${id}`);
    return data.data;
  },

  async getNextVoucherNo(): Promise<number> {
    const { data } = await axiosInstance.get("/journal-vouchers/next-no");
    return data.data?.nextVoucherNo ?? 1;
  },

  async create(payload: Partial<JournalVoucherFormData>): Promise<JournalVoucher> {
    const { data } = await axiosInstance.post("/journal-vouchers", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<JournalVoucherFormData>): Promise<JournalVoucher> {
    const { data } = await axiosInstance.put(`/journal-vouchers/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/journal-vouchers/${id}`);
  },

  async exportExcel(params: Partial<JournalVoucherFilterState>): Promise<Blob> {
    const response = await axiosInstance.get("/journal-vouchers/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

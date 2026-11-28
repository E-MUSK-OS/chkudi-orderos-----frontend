import axiosInstance from "@/services/axios";
import type {
  BankBookOption,
  BankVoucher,
  BankVoucherFilterState,
  BankVoucherFormData,
  BankVoucherListResponse,
} from "../types/bankVoucher.types";

export const bankVoucherService = {
  async list(
    params: Partial<BankVoucherFilterState> & {
      page?: number;
      limit?: number;
      sortField?: string;
      sortAsc?: boolean;
    }
  ): Promise<BankVoucherListResponse> {
    const { data } = await axiosInstance.get("/bank-vouchers", { params });
    return {
      items: data.data || [],
      total: data.meta?.total ?? 0,
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      totalPages: data.meta?.totalPages ?? 1,
      totalPaymentSum: data.meta?.totalPaymentSum ?? 0,
      totalReceiptSum: data.meta?.totalReceiptSum ?? 0,
    };
  },

  async getById(id: string): Promise<BankVoucher> {
    const { data } = await axiosInstance.get(`/bank-vouchers/${id}`);
    return data.data;
  },

  async getNextVoucherNo(
    entryType: "Payment" | "Advanced Payment" | "Receipt" | "Advance Receipt"
  ): Promise<number> {
    const { data } = await axiosInstance.get("/bank-vouchers/next-no", {
      params: { entryType },
    });
    return data.data?.nextVoucherNo ?? 1;
  },

  async getBankBooks(): Promise<BankBookOption[]> {
    const { data } = await axiosInstance.get("/bank-vouchers/bank-books");
    return data.data || [];
  },

  async create(payload: Partial<BankVoucherFormData>): Promise<BankVoucher> {
    const { data } = await axiosInstance.post("/bank-vouchers", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<BankVoucherFormData>): Promise<BankVoucher> {
    const { data } = await axiosInstance.put(`/bank-vouchers/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosInstance.delete(`/bank-vouchers/${id}`);
  },

  async uploadSalaryReport(
    file: File,
    bankBook: { bankBookId?: string; bankBookName: string; bankName?: string }
  ): Promise<{ importedCount: number; batchId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bankBookName", bankBook.bankBookName);
    if (bankBook.bankBookId) formData.append("bankBookId", bankBook.bankBookId);
    if (bankBook.bankName) formData.append("bankName", bankBook.bankName);

    const { data } = await axiosInstance.post("/bank-vouchers/upload-salary-report", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async exportExcel(params: Partial<BankVoucherFilterState>): Promise<Blob> {
    const response = await axiosInstance.get("/bank-vouchers/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

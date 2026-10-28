import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalesInvoice,
  SalesInvoiceFormData,
  SalesInvoiceFilterState,
} from "../types/salesInvoice.types";

export const salesInvoiceService = {
  async getNextInvoiceNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/next-no`);
    if (!res.ok) {
      throw new Error("Failed to fetch next invoice sequence number.");
    }
    const json = await res.json();
    return json.data?.nextInvoiceNo || "1";
  },

  async createInvoice(data: SalesInvoiceFormData): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create sales invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async getInvoices(filters?: SalesInvoiceFilterState): Promise<{
    data: SalesInvoice[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.invoiceNo) params.append("invoiceNo", filters.invoiceNo);
      if (filters.challanNo) params.append("challanNo", filters.challanNo);
      if (filters.challanRefNo) params.append("challanRefNo", filters.challanRefNo);
      if (filters.partyName) params.append("partyName", filters.partyName);
      if (filters.productSku) params.append("productSku", filters.productSku);
      if (filters.invoiceType && filters.invoiceType !== "All") params.append("invoiceType", filters.invoiceType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch sales invoices.");
    }

    const json = await res.json();
    return {
      data: json.data || [],
      meta: json.meta || { total: 0, page: 1, limit: 50 },
    };
  },

  async getInvoiceById(id: string): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`);
    if (!res.ok) {
      throw new Error("Sales invoice not found.");
    }
    const json = await res.json();
    return json.data;
  },

  async getInvoiceByChallanId(challanId: string): Promise<SalesInvoice | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/by-challan/${challanId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async updateInvoice(id: string, data: Partial<SalesInvoiceFormData>): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update sales invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete sales invoice.");
    }
  },

  async downloadDetailExcel(filters?: SalesInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/detail?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download detail excel.");
    return await res.blob();
  },

  async downloadSkuWiseExcel(filters?: SalesInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/sku-wise?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download SKU wise excel.");
    return await res.blob();
  },

  async downloadTallyExcel(filters?: SalesInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/tally?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download Tally excel.");
    return await res.blob();
  },

  downloadFile(blob: Blob, filename: string) {
    if (typeof window === "undefined") return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async downloadDetail(filters?: string | SalesInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadDetailExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_Detail_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSkuWise(filters?: string | SalesInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadSkuWiseExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_SKU_Wise_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadTally(filters?: string | SalesInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadTallyExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_Tally_${new Date().toISOString().split("T")[0]}.xlsx`);
  },
};

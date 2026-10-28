import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  PurchaseInvoice,
  PurchaseInvoiceFormData,
  PurchaseInvoiceFilterState,
} from "../types/purchaseInvoice.types";

export const purchaseInvoiceService = {
  async getNextInvoiceNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/next-no`);
    if (!res.ok) {
      throw new Error("Failed to fetch next invoice sequence number.");
    }
    const json = await res.json();
    return json.data?.nextInvoiceNo || "1";
  },

  async createInvoice(data: PurchaseInvoiceFormData): Promise<PurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create purchase invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async getInvoices(filters?: PurchaseInvoiceFilterState): Promise<{
    data: PurchaseInvoice[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.invoiceNo) params.append("invoiceNo", filters.invoiceNo);
      if (filters.challanNo) params.append("challanNo", filters.challanNo);
      if (filters.partyName) params.append("partyName", filters.partyName);
      if (filters.productSku) params.append("productSku", filters.productSku);
      if (filters.invoiceType && filters.invoiceType !== "All") params.append("invoiceType", filters.invoiceType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch purchase invoices.");
    }

    const json = await res.json();
    return {
      data: json.data || [],
      meta: json.meta || { total: 0, page: 1, limit: 50 },
    };
  },

  async getInvoiceById(id: string): Promise<PurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/${id}`);
    if (!res.ok) {
      throw new Error("Purchase invoice not found.");
    }
    const json = await res.json();
    return json.data;
  },

  async getInvoiceByChallanId(challanId: string): Promise<PurchaseInvoice | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/by-challan/${challanId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async updateInvoice(id: string, data: Partial<PurchaseInvoiceFormData>): Promise<PurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update purchase invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete purchase invoice.");
    }
  },

  async downloadDetailExcel(filters?: PurchaseInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/export/detail?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download detail excel.");
    return await res.blob();
  },

  async downloadSkuWiseExcel(filters?: PurchaseInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/export/sku-wise?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download SKU wise excel.");
    return await res.blob();
  },

  async downloadTallyExcel(filters?: PurchaseInvoiceFilterState): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-invoices/export/tally?${params.toString()}`);
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

  async downloadDetail(filters?: string | PurchaseInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadDetailExcel(filterObj);
    this.downloadFile(blob, `Purchase_Invoices_Detail_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSkuWise(filters?: string | PurchaseInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadSkuWiseExcel(filterObj);
    this.downloadFile(blob, `Purchase_Invoices_SKU_Wise_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadTally(filters?: string | PurchaseInvoiceFilterState) {
    const filterObj = typeof filters === "string" ? { search: filters } : filters;
    const blob = await this.downloadTallyExcel(filterObj);
    this.downloadFile(blob, `Purchase_Invoices_Tally_${new Date().toISOString().split("T")[0]}.xlsx`);
  },
};

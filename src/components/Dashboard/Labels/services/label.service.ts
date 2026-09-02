import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/lib/config";
import { LabelTemplate, ProductLookupResult } from "../types/label.types";

const BASE_URL = `${API_BASE_URL}/labels`;

export interface PrintLogItemPayload {
  sku: string;
  count: number;
}

export interface PrintLogResult {
  success?: boolean;
}

export interface PrintStatEntry {
  sku: string;
  count: number;
}

export const labelService = {
  // 1. Templates
  getTemplates: async (marketplaceId?: string): Promise<LabelTemplate[]> => {
    const url = marketplaceId ? `${BASE_URL}/templates?marketplaceId=${marketplaceId}` : `${BASE_URL}/templates`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Failed to fetch templates");
    const data = await res.json();
    return data.data;
  },

  getTemplateById: async (id: string): Promise<LabelTemplate> => {
    const res = await fetchWithAuth(`${BASE_URL}/templates/${id}`);
    if (!res.ok) throw new Error("Failed to fetch template");
    const data = await res.json();
    return data.data;
  },

  createTemplate: async (template: Omit<LabelTemplate, "id">): Promise<LabelTemplate> => {
    const res = await fetchWithAuth(`${BASE_URL}/templates`, {
      method: "POST",
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to create template");
    const data = await res.json();
    return data.data;
  },

  updateTemplate: async (id: string, template: Partial<LabelTemplate>): Promise<LabelTemplate> => {
    const res = await fetchWithAuth(`${BASE_URL}/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to update template");
    const data = await res.json();
    return data.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`${BASE_URL}/templates/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete template");
  },

  // 2. Lookup
  lookupProduct: async (query: string, warehouseId?: string): Promise<ProductLookupResult[]> => {
    const url = warehouseId 
      ? `${BASE_URL}/product-lookup?q=${encodeURIComponent(query)}&warehouseId=${warehouseId}`
      : `${BASE_URL}/product-lookup?q=${encodeURIComponent(query)}`;
    
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Product not found");
    const data = await res.json();
    return data.data;
  },

  // 3. Print Logs
  logPrintSession: async (items: PrintLogItemPayload[]): Promise<PrintLogResult> => {
    const res = await fetchWithAuth(`${BASE_URL}/print-log`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error("Failed to log print session");
    const data = await res.json();
    return data.data;
  },

  getPrintStats: async (): Promise<PrintStatEntry[]> => {
    const res = await fetchWithAuth(`${BASE_URL}/print-stats`);
    if (!res.ok) throw new Error("Failed to fetch print stats");
    const data = await res.json();
    return data.data;
  }
};

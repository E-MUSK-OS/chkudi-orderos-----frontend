import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalesChallan,
  Party,
  ProductSkuSuggestion,
  ChallanFiltersState,
} from "../types/challan.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  let msg = err.message || fallback;
  if (typeof msg === "string" && msg.trim().startsWith("[") && msg.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(msg);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => p.message || p.code || "Validation error").join(", ");
      }
    } catch (_) {}
  }
  return msg;
}

export const challanService = {
  // ======================================================
  // Sales Challan API
  // ======================================================

  async getChallans(filters?: Partial<ChallanFiltersState>): Promise<{
    data: SalesChallan[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== "All") params.append(key, val);
      });
    }

    const res = await fetchWithAuth(
      `${API_BASE_URL}/sales-challans?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch challans"));
    }
    return await res.json();
  },

  async getChallanById(id: string): Promise<{ data: SalesChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-challans/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch challan"));
    }
    return await res.json();
  },

  async getNextChallanNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-challans/next-no`);
    if (!res.ok) return "1";
    const data = await res.json();
    return data?.data?.nextChallanNo || "1";
  },

  async createChallan(payload: any): Promise<{ data: SalesChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-challans`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create challan"));
    }
    return await res.json();
  },

  async updateChallan(id: string, payload: any): Promise<{ data: SalesChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-challans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update challan"));
    }
    return await res.json();
  },

  async deleteChallan(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-challans/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete challan"));
    }
  },

  async searchSkus(query: string): Promise<ProductSkuSuggestion[]> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/sales-challans/search-skus?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  },

  // ======================================================
  // Party / Ledger API
  // ======================================================

  async getParties(search = "", accountHead = ""): Promise<Party[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (accountHead && accountHead !== "All") params.append("accountHead", accountHead);

    const res = await fetchWithAuth(`${API_BASE_URL}/parties?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  },

  async createParty(payload: Partial<Party>): Promise<Party> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create party"));
    }
    const data = await res.json();
    return data.data;
  },

  async updateParty(id: string, payload: Partial<Party>): Promise<Party> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update party"));
    }
    const data = await res.json();
    return data.data;
  },
};

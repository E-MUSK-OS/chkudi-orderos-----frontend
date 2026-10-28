import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  PurchaseChallan,
  Party,
  ProductSkuSuggestion,
  PurchaseChallanFiltersState,
} from "../types/purchaseChallan.types";

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

export const purchaseChallanService = {
  // ======================================================
  // Purchase Challan API
  // ======================================================

  async getChallans(filters?: Partial<PurchaseChallanFiltersState>): Promise<{
    data: PurchaseChallan[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== "All") params.append(key, val);
      });
    }

    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-challans?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch purchase challans"));
    }
    return await res.json();
  },

  async getChallanById(id: string): Promise<{ data: PurchaseChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-challans/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch purchase challan"));
    }
    return await res.json();
  },

  async getNextChallanNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-challans/next-no`);
    if (!res.ok) return "1001";
    const data = await res.json();
    return data?.data?.nextChallanNo || "1001";
  },

  async createChallan(payload: any): Promise<{ data: PurchaseChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-challans`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create purchase challan"));
    }
    return await res.json();
  },

  async updateChallan(id: string, payload: any): Promise<{ data: PurchaseChallan }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-challans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update purchase challan"));
    }
    return await res.json();
  },

  async deleteChallan(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-challans/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete purchase challan"));
    }
  },

  async searchSkus(query: string): Promise<ProductSkuSuggestion[]> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-challans/search-skus?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  },

  // ======================================================
  // Party / Supplier API
  // ======================================================

  async getSuppliers(search = "", accountHead = "Sundry Creditors"): Promise<Party[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (accountHead && accountHead !== "All") params.append("accountHead", accountHead);

    const res = await fetchWithAuth(`${API_BASE_URL}/parties?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  },

  async createSupplier(payload: Partial<Party>): Promise<Party> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create supplier"));
    }
    const data = await res.json();
    return data.data;
  },
};

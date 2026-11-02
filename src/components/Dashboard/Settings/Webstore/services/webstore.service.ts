import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Webstore, WebstoreFilterState } from "../types/webstore.types";

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

export const webstoreService = {
  async getWebstores(filters?: Partial<WebstoreFilterState>): Promise<{
    data: Webstore[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.marketplaceName && filters.marketplaceName !== "All") {
        params.append("marketplaceName", filters.marketplaceName);
      }
      if (filters.isActive && filters.isActive !== "All") {
        params.append("isActive", filters.isActive === "Active" ? "true" : "false");
      }
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("limit", String(filters.pageSize));
    }

    const res = await fetchWithAuth(
      `${API_BASE_URL}/webstores?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load webstores."));
    }
    return await res.json();
  },

  async getNextCode(): Promise<number> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/next-code`);
    if (!res.ok) return 1;
    const data = await res.json();
    return data?.data?.nextCode || 1;
  },

  async getWebstoreById(id: string): Promise<{ data: Webstore }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load webstore details."));
    }
    return await res.json();
  },

  async createWebstore(payload: any): Promise<{ data: Webstore }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create webstore."));
    }
    return await res.json();
  },

  async updateWebstore(id: string, payload: any): Promise<{ data: Webstore }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update webstore."));
    }
    return await res.json();
  },

  async toggleStatus(id: string): Promise<{ data: Webstore }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}/status`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update status."));
    }
    return await res.json();
  },

  async deleteWebstore(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete webstore."));
    }
  },

  async testSpapiConnection(payload: {
    spClientId: string;
    spClientSecret: string;
    refreshToken: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/test-spapi`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) {
      throw new Error(result.message || "Failed to verify Amazon SP-API connection.");
    }
    return result;
  },
};


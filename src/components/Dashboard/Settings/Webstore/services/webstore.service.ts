import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Webstore, WebstoreFilterState } from "../types/webstore.types";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "object" && err !== null) {
    const errorRecord = err as Record<string, unknown>;
    const msg = typeof errorRecord.message === "string" ? errorRecord.message : fallback;
    if (typeof msg === "string" && msg.trim().startsWith("[") && msg.trim().endsWith("]")) {
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((p: unknown) => {
              if (p && typeof p === "object") {
                const item = p as Record<string, unknown>;
                return String(item.message || item.code || "Validation error");
              }
              return "Validation error";
            })
            .join(", ");
        }
      } catch {
        // Ignore json parse error
      }
    }
    return msg;
  }
  return fallback;
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

  async createWebstore(
    payload: Partial<Webstore> | Record<string, unknown>
  ): Promise<{ success: boolean; data?: Webstore; error?: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.success === false) {
      return {
        success: false,
        error: extractErrorMessage(result, "Failed to create webstore."),
      };
    }
    return {
      success: true,
      data: result.data,
    };
  },

  async updateWebstore(
    id: string,
    payload: Partial<Webstore> | Record<string, unknown>
  ): Promise<{ success: boolean; data?: Webstore; error?: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.success === false) {
      return {
        success: false,
        error: extractErrorMessage(result, "Failed to update webstore."),
      };
    }
    return {
      success: true,
      data: result.data,
    };
  },

  async toggleStatus(id: string): Promise<{ success: boolean; data?: Webstore; error?: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}/status`, {
      method: "PATCH",
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.success === false) {
      return {
        success: false,
        error: extractErrorMessage(result, "Failed to update status."),
      };
    }
    return {
      success: true,
      data: result.data,
    };
  },

  async deleteWebstore(id: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/webstores/${id}`, {
      method: "DELETE",
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.success === false) {
      return {
        success: false,
        error: extractErrorMessage(result, "Failed to delete webstore."),
      };
    }
    return { success: true };
  },

  async testSpapiConnection(payload: {
    spClientId: string;
    spClientSecret: string;
    refreshToken: string;
  }): Promise<{ success: boolean; message: string; data?: unknown }> {
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

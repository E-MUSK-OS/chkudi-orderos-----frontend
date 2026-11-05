import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { RequestedPO } from "../types/requestedPo.types";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

// Clean any legacy localStorage keys to ensure browser storage is completely free of PO data
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("orderos_requested_pos_v1");
  } catch {
    // Ignore in non-browser environments
  }
}

export const requestedPoService = {
  async getAll(params?: {
    storeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<RequestedPO[]> {
    const query = new URLSearchParams();
    if (params?.storeId && params.storeId !== "all") query.append("storeId", params.storeId);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE_URL}/requested-pos${qs ? `?${qs}` : ""}`;

    const res = await fetchWithAuth(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load purchase orders from database."));
    }
    const json = await res.json();
    return json.data || [];
  },

  async getByStoreId(storeId: string): Promise<RequestedPO[]> {
    return await this.getAll({ storeId });
  },

  async getById(idOrPoNumber: string): Promise<RequestedPO | null> {
    if (!idOrPoNumber) return null;
    const clean = encodeURIComponent(String(idOrPoNumber).replace(/^#/, "").trim());
    const res = await fetchWithAuth(`${API_BASE_URL}/requested-pos/${clean}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load purchase order details from database."));
    }
    const json = await res.json();
    return json.data || null;
  },

  async getLatestDates(): Promise<Record<string, string>> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/requested-pos/latest-dates`);
      if (res.ok) {
        const json = await res.json();
        const dates: Record<string, string> = json.data || {};
        return dates;
      }
    } catch (e) {
      console.error("Failed to load latest PO dates from database:", e);
    }
    return {};
  },

  async save(po: Partial<RequestedPO>): Promise<RequestedPO> {
    // Determine whether this is an update to an existing DB record
    const isUpdate = Boolean(po.id && !po.id.startsWith("po_"));
    const url = isUpdate
      ? `${API_BASE_URL}/requested-pos/${encodeURIComponent(po.id!)}`
      : `${API_BASE_URL}/requested-pos`;
    const method = isUpdate ? "PUT" : "POST";

    const res = await fetchWithAuth(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(po),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to save purchase order to database."));
    }

    const json = await res.json();
    return json.data;
  },

  async delete(idOrPoNumber: string): Promise<void> {
    const clean = encodeURIComponent(String(idOrPoNumber).replace(/^#/, "").trim());
    const res = await fetchWithAuth(`${API_BASE_URL}/requested-pos/${clean}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete purchase order from database."));
    }
  },
};

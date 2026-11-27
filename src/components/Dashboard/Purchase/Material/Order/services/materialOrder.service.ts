import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  MaterialCatalogOption,
  MaterialOrderFiltersState,
  MaterialOrderParty,
  MaterialPurchaseOrder,
} from "../types/materialOrder.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  const msg = err.message || fallback;
  if (typeof msg === "string" && msg.trim().startsWith("[") && msg.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(msg);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => p.message || p.code || "Validation error").join(", ");
      }
    } catch {
      // ignore
    }
  }
  return msg;
}

async function parseJsonSafe(res: Response, fallback: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      throw new Error(
        res.status === 404
          ? "Material Purchase Order API not found (please restart backend server)."
          : `${fallback} (HTTP ${res.status})`
      );
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${fallback} (HTTP ${res.status})`);
    }
  }
  const json = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(json, fallback));
  return json;
}

export const materialOrderService = {
  async getOrders(filters?: Partial<MaterialOrderFiltersState>): Promise<{
    data: {
      orders: MaterialPurchaseOrder[];
      total: number;
      sumOrderedQty: number;
      sumReceivedQty: number;
      sumPendingQty: number;
      sumTotalAmount: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.status && filters.status !== "All") params.set("status", filters.status);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-orders?${params.toString()}`
    );
    return await parseJsonSafe(res, "Failed to load material orders");
  },

  async getNextOrderNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-orders/next-no`);
    const json = await parseJsonSafe(res, "Failed to get next order number");
    return json?.data?.nextOrderNo || "PO/2026-2027/1";
  },

  async getOrderById(id: string): Promise<MaterialPurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-orders/${id}`);
    const json = await parseJsonSafe(res, "Failed to load material order");
    return json.data;
  },

  async createOrder(payload: any): Promise<MaterialPurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to create material order");
    return json.data;
  },

  async updateOrder(id: string, payload: any): Promise<MaterialPurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to update material order");
    return json.data;
  },

  async deleteOrder(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-orders/${id}`, {
      method: "DELETE",
    });
    await parseJsonSafe(res, "Failed to delete material order");
  },

  async exportExcel(filters?: Partial<MaterialOrderFiltersState>): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.status && filters.status !== "All") params.set("status", filters.status);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-orders/export/excel?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to export material purchase orders");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material-purchase-orders-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getParties(): Promise<MaterialOrderParty[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties?limit=500`);
    const json = await res.json();
    if (!res.ok) return [];
    const list = json?.data?.parties || json?.data || [];
    return Array.isArray(list) ? list : [];
  },

  async getMaterials(): Promise<MaterialCatalogOption[]> {
    const res = await fetchWithAuth(`${API_BASE_URL}/materials?limit=500`);
    const json = await res.json();
    if (!res.ok) return [];
    const list = json?.data?.materials || json?.data || [];
    if (!Array.isArray(list)) return [];

    return list
      .map((m: any) => {
        const baseSku = m.sku || m.masterSku || m.materialName || "";
        if (!baseSku) return null;
        return {
          id: m.id,
          materialName: m.materialName || baseSku,
          masterSku: m.masterSku || baseSku,
          sku: baseSku,
          category: m.category || "",
          unit: m.unit || "",
          hsnCode: m.hsnCode || "",
          gstRate:
            m.gstRate !== undefined && m.gstRate !== null ? Number(m.gstRate) : 0,
          materialCost:
            m.materialCost !== undefined && m.materialCost !== null
              ? Number(m.materialCost)
              : 0,
          dealerRate:
            m.dealerRate !== undefined && m.dealerRate !== null
              ? Number(m.dealerRate)
              : 0,
          retailRate:
            m.retailRate !== undefined && m.retailRate !== null
              ? Number(m.retailRate)
              : 0,
          salesRate:
            m.salesRate !== undefined && m.salesRate !== null
              ? Number(m.salesRate)
              : 0,
        };
      })
      .filter(Boolean) as MaterialCatalogOption[];
  },

  async getMaterialDropdownOptions(): Promise<{ categories: string[]; units: string[] }> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/materials/dropdown-options`);
      if (!res.ok) return { categories: [], units: [] };
      const json = await res.json();
      const data = json?.data || {};
      const toStrings = (arr: any[]) =>
        Array.isArray(arr)
          ? arr.map((x) => (typeof x === "string" ? x : x?.value || x?.label || "")).filter(Boolean)
          : [];
      return {
        categories: toStrings(data.category || data.categories || []),
        units: toStrings(data.unit || data.units || []),
      };
    } catch {
      return { categories: [], units: [] };
    }
  },
};

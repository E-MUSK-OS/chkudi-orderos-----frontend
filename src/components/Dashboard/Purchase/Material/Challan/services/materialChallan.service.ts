import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  MaterialChallanFiltersState,
  MaterialPurchaseChallan,
  PartySkuOption,
  PendingMaterialOrder,
} from "../types/materialChallan.types";

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
          ? "Material Purchase Challan API not found (please restart backend server)."
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

export const materialChallanService = {
  async getChallans(filters?: Partial<MaterialChallanFiltersState>): Promise<{
    data: {
      challans: MaterialPurchaseChallan[];
      total: number;
      sumTotalQty: number;
      sumTotalRealQty: number;
      sumTotalAmount: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.partyChallanNo) params.set("partyChallanNo", filters.partyChallanNo);
    if (filters?.challanFor && filters.challanFor !== "All") params.set("challanFor", filters.challanFor);
    if (filters?.material && filters.material !== "All") params.set("material", filters.material);
    if (filters?.invoiceStatus && filters.invoiceStatus !== "All")
      params.set("invoiceStatus", filters.invoiceStatus);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-challans?${params.toString()}`
    );
    return await parseJsonSafe(res, "Failed to load material challans");
  },

  async getNextChallanNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-challans/next-no`);
    const json = await parseJsonSafe(res, "Failed to get next challan number");
    return json?.data?.nextChallanNo || "PC/2026-2027/1";
  },

  async getChallanById(id: string): Promise<MaterialPurchaseChallan> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-challans/${id}`);
    const json = await parseJsonSafe(res, "Failed to load material challan");
    return json.data;
  },

  async getPendingOrders(supplierId: string): Promise<PendingMaterialOrder[]> {
    if (!supplierId) return [];
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-challans/pending-orders/${supplierId}`
    );
    const json = await parseJsonSafe(res, "Failed to load pending orders");
    return Array.isArray(json?.data) ? json.data : [];
  },

  async getPartySkus(supplierId: string): Promise<PartySkuOption[]> {
    if (!supplierId) return [];
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-challans/party-skus/${supplierId}`
    );
    const json = await parseJsonSafe(res, "Failed to load party SKUs");
    return Array.isArray(json?.data) ? json.data : [];
  },

  async createChallan(payload: any): Promise<MaterialPurchaseChallan> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-challans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to create material challan");
    return json.data;
  },

  async updateChallan(id: string, payload: any): Promise<MaterialPurchaseChallan> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-challans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to update material challan");
    return json.data;
  },

  async deleteChallan(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-challans/${id}`, {
      method: "DELETE",
    });
    await parseJsonSafe(res, "Failed to delete material challan");
  },

  async exportExcel(
    filters?: Partial<MaterialChallanFiltersState> & { ids?: string[] }
  ): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.ids && filters.ids.length > 0) {
      params.set("ids", filters.ids.join(","));
    }
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.partyChallanNo) params.set("partyChallanNo", filters.partyChallanNo);
    if (filters?.challanFor && filters.challanFor !== "All") params.set("challanFor", filters.challanFor);
    if (filters?.material && filters.material !== "All") params.set("material", filters.material);
    if (filters?.invoiceStatus && filters.invoiceStatus !== "All")
      params.set("invoiceStatus", filters.invoiceStatus);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-challans/export/excel?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to export material purchase challans");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material-purchase-challans-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getEmployees(): Promise<string[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees?limit=200`);
      if (!res.ok) return [];
      const json = await res.json();
      const list = json?.data?.employees || json?.data || [];
      if (!Array.isArray(list)) return [];
      return list
        .map((e: any) => e.fullName || e.name || e.username || "")
        .filter(Boolean);
    } catch {
      return [];
    }
  },
};

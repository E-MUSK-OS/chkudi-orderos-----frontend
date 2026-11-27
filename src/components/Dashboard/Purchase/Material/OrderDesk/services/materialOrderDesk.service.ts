import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  MaterialOrderDeskLot,
  MaterialOrderDeskLotsResponse,
  MaterialOrderDeskRequirementItem,
  MaterialOrderDeskSummaryResponse,
} from "../types/materialOrderDesk.types";

async function parseJsonSafe(res: Response, fallback: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      throw new Error(
        res.status === 404
          ? "Material Order Desk API not found (please restart backend server)."
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
  if (!res.ok) throw new Error(json?.message || fallback);
  return json;
}

export const materialOrderDeskService = {
  async getSummary(
    category: "Fabric" | "Trim",
    search?: string
  ): Promise<MaterialOrderDeskSummaryResponse> {
    const params = new URLSearchParams();
    params.set("category", category);
    if (search) params.set("search", search);
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-order-desk/summary?${params.toString()}`
    );
    const json = await parseJsonSafe(res, "Failed to load Order Desk summary");
    return json.data;
  },

  async getLots(filters?: {
    masterSku?: string;
    productSku?: string;
  }): Promise<MaterialOrderDeskLotsResponse> {
    const params = new URLSearchParams();
    if (filters?.masterSku) params.set("masterSku", filters.masterSku);
    if (filters?.productSku) params.set("productSku", filters.productSku);
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-order-desk/lots?${params.toString()}`
    );
    const json = await parseJsonSafe(res, "Failed to load Lot Details");
    return json.data;
  },

  async createLot(payload: {
    lotNo?: string;
    masterSku: string;
    productSku: string;
    quantity: number;
    status: string;
    requirements: MaterialOrderDeskRequirementItem[];
  }): Promise<MaterialOrderDeskLot> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-order-desk/lots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to create Lot");
    return json.data;
  },

  async updateLotSelection(payload: {
    lotIds?: string[];
    isSelected: boolean;
    all?: boolean;
  }): Promise<void> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-order-desk/lots/selection`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    await parseJsonSafe(res, "Failed to update lot selection");
  },

  async deleteLot(id: string): Promise<void> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-order-desk/lots/${id}`,
      { method: "DELETE" }
    );
    await parseJsonSafe(res, "Failed to delete Lot");
  },
};

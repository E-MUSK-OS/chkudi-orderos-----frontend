import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  PurchaseOrder,
  PurchaseOrderFiltersState,
  Party,
} from "../types/purchaseOrder.types";

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

export const purchaseOrderService = {
  async getOrders(filters?: Partial<PurchaseOrderFiltersState>): Promise<{
    data: {
      orders: PurchaseOrder[];
      total: number;
      sumOrderedQty: number;
      sumReceivedQty: number;
      sumPendingQty: number;
      sumTotalAmount: number;
      page: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && val !== "All") {
          params.append(key, String(val));
        }
      });
    }

    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-orders?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch purchase orders"));
    }
    return await res.json();
  },

  async getNextOrderNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders/next-no`);
    if (!res.ok) return "PO-1";
    const data = await res.json();
    return data?.data?.nextOrderNo || "PO-1";
  },

  async getOrderById(id: string): Promise<PurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch purchase order"));
    }
    const data = await res.json();
    return data.data;
  },

  async createOrder(payload: any): Promise<PurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create purchase order"));
    }
    const data = await res.json();
    return data.data;
  },

  async updateOrder(id: string, payload: any): Promise<PurchaseOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update purchase order"));
    }
    const data = await res.json();
    return data.data;
  },

  async deleteOrder(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-orders/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete purchase order"));
    }
  },

  async getParties(search = ""): Promise<Party[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    params.append("accountHead", "Sundry Creditors");
    params.append("limit", "100");

    const res = await fetchWithAuth(`${API_BASE_URL}/parties?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  },

  async downloadOrdersExcel(filters?: Partial<PurchaseOrderFiltersState>): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && val !== "All") {
          params.append(key, String(val));
        }
      });
    }

    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-orders/export/excel?${params.toString()}`
    );
    if (!res.ok) {
      throw new Error("Failed to download purchase orders excel");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Purchase_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

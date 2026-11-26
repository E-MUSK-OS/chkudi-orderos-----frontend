import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalesOrder,
  SalesOrderFormData,
  SalesOrderFilterState,
} from "../types/salesOrder.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  return err.message || fallback;
}

export const salesOrderService = {
  async getNextOrderNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/next-no`);
    if (!res.ok) return "SO/2026-2027/1";
    const json = await res.json();
    return json?.data?.nextOrderNo || "SO/2026-2027/1";
  },

  async getOrders(filters?: Partial<SalesOrderFilterState>): Promise<{
    data: SalesOrder[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch sales orders"));
    }
    return await res.json();
  },

  async getOrderById(id: string): Promise<SalesOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch sales order"));
    }
    const json = await res.json();
    return json.data;
  },

  async createOrder(payload: SalesOrderFormData): Promise<SalesOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create sales order"));
    }
    const json = await res.json();
    return json.data;
  },

  async updateOrder(id: string, payload: SalesOrderFormData): Promise<SalesOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update sales order"));
    }
    const json = await res.json();
    return json.data;
  },

  async updateFulfillmentPlan(id: string, fulfillmentPlan: string): Promise<SalesOrder> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/${id}/fulfillment`, {
      method: "PATCH",
      body: JSON.stringify({ fulfillmentPlan }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update fulfillment plan"));
    }
    const json = await res.json();
    return json.data;
  },

  async deleteOrder(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete sales order"));
    }
  },

  async exportExcel(
    filters?: Partial<SalesOrderFilterState>,
    selectedIds?: string[]
  ): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    if (selectedIds && selectedIds.length > 0) {
      params.append("ids", selectedIds.join(","));
    }
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-orders/export?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to export Sales Orders");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

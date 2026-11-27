import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  MaterialInvoiceFiltersState,
  MaterialPurchaseInvoice,
  PendingMaterialChallan,
} from "../types/materialInvoice.types";

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
          ? "Material Purchase Invoice API not found (please restart backend server)."
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

export const materialInvoiceService = {
  async getInvoices(
    filters?: Partial<MaterialInvoiceFiltersState> & { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data: {
      invoices: MaterialPurchaseInvoice[];
      total: number;
      sumTotalQty: number;
      sumNetAmount: number;
      sumDebitNoteAmount: number;
      sumDiscDebitNoteAmount: number;
      sumPaidAmount: number;
      sumBalanceAmount: number;
      page: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.partyChallanNo) params.set("partyChallanNo", filters.partyChallanNo);
    if (filters?.partyBillNo) params.set("partyBillNo", filters.partyBillNo);
    if (filters?.invoiceType && filters.invoiceType !== "All")
      params.set("invoiceType", filters.invoiceType);
    if (filters?.material && filters.material !== "All")
      params.set("material", filters.material);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-invoices?${params.toString()}`
    );
    return await parseJsonSafe(res, "Failed to load material invoices");
  },

  async getNextInvoiceNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-invoices/next-no`);
    const json = await parseJsonSafe(res, "Failed to get next invoice number");
    return json?.data?.nextInvoiceNo || "PI/2026-2027/1";
  },

  async getInvoiceById(id: string): Promise<MaterialPurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-invoices/${id}`);
    const json = await parseJsonSafe(res, "Failed to load material invoice");
    return json.data;
  },

  async getPendingChallans(supplierId: string): Promise<PendingMaterialChallan[]> {
    if (!supplierId) return [];
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-invoices/pending-challans/${supplierId}`
    );
    const json = await parseJsonSafe(res, "Failed to load pending challans");
    return Array.isArray(json?.data) ? json.data : [];
  },

  async createInvoice(payload: any): Promise<MaterialPurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to create material invoice");
    return json.data;
  },

  async updateInvoice(id: string, payload: any): Promise<MaterialPurchaseInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to update material invoice");
    return json.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-invoices/${id}`, {
      method: "DELETE",
    });
    await parseJsonSafe(res, "Failed to delete material invoice");
  },

  async exportExcel(
    filters?: Partial<MaterialInvoiceFiltersState> & { ids?: string[] }
  ): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.ids && filters.ids.length > 0) {
      params.set("ids", filters.ids.join(","));
    }
    if (filters?.search) params.set("search", filters.search);
    if (filters?.party) params.set("party", filters.party);
    if (filters?.partyChallanNo) params.set("partyChallanNo", filters.partyChallanNo);
    if (filters?.partyBillNo) params.set("partyBillNo", filters.partyBillNo);
    if (filters?.invoiceType && filters.invoiceType !== "All")
      params.set("invoiceType", filters.invoiceType);
    if (filters?.material && filters.material !== "All")
      params.set("material", filters.material);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-invoices/export/excel?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to export material purchase invoices");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material-purchase-invoices-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getBrokers(): Promise<string[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/parties?limit=500`);
      if (!res.ok) return [];
      const json = await res.json();
      const list = json?.data?.parties || json?.data || [];
      if (!Array.isArray(list)) return [];
      return list
        .filter((p: any) =>
          (p.accountHead || "").toLowerCase().includes("broker") ||
          (p.accountHead || "").toLowerCase().includes("agent")
        )
        .map((p: any) => p.partyName)
        .filter(Boolean);
    } catch {
      return [];
    }
  },
};

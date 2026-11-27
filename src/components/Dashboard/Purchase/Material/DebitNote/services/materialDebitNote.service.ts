import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { MaterialPurchaseInvoice } from "../../Invoice/types/materialInvoice.types";
import {
  MaterialDebitNoteFiltersState,
  MaterialPurchaseDebitNote,
} from "../types/materialDebitNote.types";

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
          ? "Material Debit Note API not found (please restart backend server)."
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

export const materialDebitNoteService = {
  async getDebitNotes(
    filters?: Partial<MaterialDebitNoteFiltersState> & { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data: {
      debitNotes: MaterialPurchaseDebitNote[];
      total: number;
      sumTotalQty: number;
      sumNetAmount: number;
      page: number;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.supplier) params.set("supplier", filters.supplier);
    if (filters?.debitNoteNo) params.set("debitNoteNo", filters.debitNoteNo);
    if (filters?.debitNoteType && filters.debitNoteType !== "All")
      params.set("debitNoteType", filters.debitNoteType);
    if (filters?.invoiceType && filters.invoiceType !== "All")
      params.set("invoiceType", filters.invoiceType);
    if (filters?.material && filters.material !== "All")
      params.set("material", filters.material);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-debit-notes?${params.toString()}`
    );
    return await parseJsonSafe(res, "Failed to load material debit notes");
  },

  async getNextDebitNoteNo(type?: "Return" | "Discount"): Promise<string> {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-debit-notes/next-no${query}`
    );
    const json = await parseJsonSafe(res, "Failed to get next debit note number");
    return (
      json?.data?.nextDebitNoteNo ||
      (type === "Discount" ? "DDN/2026-2027/1" : "DN/2026-2027/1")
    );
  },

  async getDebitNoteById(id: string): Promise<MaterialPurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-debit-notes/${id}`);
    const json = await parseJsonSafe(res, "Failed to load material debit note");
    return json.data;
  },

  async getSupplierInvoices(supplierId: string): Promise<MaterialPurchaseInvoice[]> {
    if (!supplierId) return [];
    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-debit-notes/supplier-invoices/${supplierId}`
    );
    const json = await parseJsonSafe(res, "Failed to load supplier invoices");
    return Array.isArray(json?.data) ? json.data : [];
  },

  async createDebitNote(payload: any): Promise<MaterialPurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-debit-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to create material debit note");
    return json.data;
  },

  async updateDebitNote(id: string, payload: any): Promise<MaterialPurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-debit-notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await parseJsonSafe(res, "Failed to update material debit note");
    return json.data;
  },

  async deleteDebitNote(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/material-purchase-debit-notes/${id}`, {
      method: "DELETE",
    });
    await parseJsonSafe(res, "Failed to delete material debit note");
  },

  async exportExcel(
    filters?: Partial<MaterialDebitNoteFiltersState> & { ids?: string[] }
  ): Promise<void> {
    const params = new URLSearchParams();
    if (filters?.ids && filters.ids.length > 0) params.set("ids", filters.ids.join(","));
    if (filters?.search) params.set("search", filters.search);
    if (filters?.supplier) params.set("supplier", filters.supplier);
    if (filters?.debitNoteNo) params.set("debitNoteNo", filters.debitNoteNo);
    if (filters?.debitNoteType && filters.debitNoteType !== "All")
      params.set("debitNoteType", filters.debitNoteType);
    if (filters?.invoiceType && filters.invoiceType !== "All")
      params.set("invoiceType", filters.invoiceType);
    if (filters?.material && filters.material !== "All")
      params.set("material", filters.material);
    if (filters?.startDate) params.set("startDate", filters.startDate);
    if (filters?.endDate) params.set("endDate", filters.endDate);

    const res = await fetchWithAuth(
      `${API_BASE_URL}/material-purchase-debit-notes/export/excel?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to export material debit notes");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material-debit-notes-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

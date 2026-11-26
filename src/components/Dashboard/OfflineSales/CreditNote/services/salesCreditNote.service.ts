import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalesCreditNote,
  SalesCreditNoteFormData,
  CreditNoteFilterState,
} from "../types/salesCreditNote.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  return err.message || fallback;
}

export const salesCreditNoteService = {
  async getNextCreditNoteNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-credit-notes/next-no`);
    if (!res.ok) return "CN/2026-2027/1";
    const json = await res.json();
    return json?.data?.nextCreditNoteNo || "CN/2026-2027/1";
  },

  async getCreditNotes(filters?: Partial<CreditNoteFilterState>): Promise<{
    data: SalesCreditNote[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    const res = await fetchWithAuth(
      `${API_BASE_URL}/sales-credit-notes?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch credit notes"));
    }
    return await res.json();
  },

  async getCreditNoteById(id: string): Promise<SalesCreditNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-credit-notes/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch credit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async createCreditNote(payload: SalesCreditNoteFormData): Promise<SalesCreditNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-credit-notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create credit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async updateCreditNote(
    id: string,
    payload: SalesCreditNoteFormData
  ): Promise<SalesCreditNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-credit-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update credit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async deleteCreditNote(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-credit-notes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete credit note"));
    }
  },

  async exportExcel(filters?: Partial<CreditNoteFilterState>): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    const res = await fetchWithAuth(
      `${API_BASE_URL}/sales-credit-notes/export?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to export Credit Notes");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_credit_notes_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

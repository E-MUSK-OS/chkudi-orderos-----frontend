import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  PurchaseDebitNote,
  PurchaseDebitNoteFormData,
  DebitNoteFilterState,
} from "../types/purchaseDebitNote.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  return err.message || fallback;
}

export const purchaseDebitNoteService = {
  async getNextDebitNoteNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-debit-notes/next-no`);
    if (!res.ok) return "DN/2026-2027/1";
    const json = await res.json();
    return json?.data?.nextDebitNoteNo || "DN/2026-2027/1";
  },

  async getDebitNotes(filters?: Partial<DebitNoteFilterState>): Promise<{
    data: PurchaseDebitNote[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-debit-notes?${params.toString()}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch debit notes"));
    }
    return await res.json();
  },

  async getDebitNoteById(id: string): Promise<PurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-debit-notes/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to fetch debit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async createDebitNote(payload: PurchaseDebitNoteFormData): Promise<PurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-debit-notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create debit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async updateDebitNote(
    id: string,
    payload: PurchaseDebitNoteFormData
  ): Promise<PurchaseDebitNote> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-debit-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update debit note"));
    }
    const json = await res.json();
    return json.data;
  },

  async deleteDebitNote(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/purchase-debit-notes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete debit note"));
    }
  },

  async downloadExcel(filters?: Partial<DebitNoteFilterState>): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== "All") params.append(k, String(v));
      });
    }
    const res = await fetchWithAuth(
      `${API_BASE_URL}/purchase-debit-notes/export?${params.toString()}`
    );
    if (!res.ok) throw new Error("Failed to download Debit Notes Excel");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "purchase_debit_notes.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

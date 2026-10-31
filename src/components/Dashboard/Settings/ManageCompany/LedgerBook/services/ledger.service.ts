import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Ledger,
  LedgerFilterState,
  CreateLedgerPayload,
  UpdateLedgerPayload,
} from "../types/ledger.types";

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

export const ledgerService = {
  async getLedgers(filters?: Partial<LedgerFilterState>): Promise<{
    data: Ledger[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.ledgerName) params.append("ledgerName", filters.ledgerName);
      if (filters.accountHead && filters.accountHead !== "All") {
        params.append("accountHead", filters.accountHead);
      }
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("limit", String(filters.pageSize));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/parties?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load ledgers."));
    }
    return await res.json();
  },

  async getLedgerById(id: string): Promise<{ data: Ledger }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load ledger details."));
    }
    return await res.json();
  },

  async createLedger(payload: CreateLedgerPayload): Promise<{ data: Ledger; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create ledger."));
    }
    return await res.json();
  },

  async updateLedger(id: string, payload: UpdateLedgerPayload): Promise<{ data: Ledger; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update ledger."));
    }
    return await res.json();
  },

  async deleteLedger(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete ledger."));
    }
  },

  async bulkImport(items: any[]): Promise<{ data: Ledger[]; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/parties/bulk`, {
      method: "POST",
      body: JSON.stringify(items),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to import ledgers."));
    }
    return await res.json();
  },
};


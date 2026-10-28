import { RequestedPO } from "../types/requestedPo.types";

const STORAGE_KEY = "orderos_requested_pos_v1";

export const requestedPoService = {
  getAll(): RequestedPO[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getByStoreId(storeId: string): RequestedPO[] {
    const all = this.getAll();
    return all.filter((po) => po.storeId === storeId);
  },

  getLatestDateByStoreId(storeId: string): string | null {
    const list = this.getByStoreId(storeId);
    if (!list || list.length === 0) return null;
    const sorted = [...list].sort(
      (a, b) => new Date(b.poDate || b.createdAt).getTime() - new Date(a.poDate || a.createdAt).getTime()
    );
    return sorted[0].poDate;
  },

  save(po: RequestedPO): RequestedPO {
    const all = this.getAll();
    const updated = [po, ...all.filter((p) => p.id !== po.id)];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return po;
  },

  delete(id: string): void {
    const all = this.getAll();
    const updated = all.filter((p) => p.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },
};

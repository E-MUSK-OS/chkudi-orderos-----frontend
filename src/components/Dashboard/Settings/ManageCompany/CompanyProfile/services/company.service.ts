import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Company,
  CompanyFilterState,
  CreateCompanyDraftPayload,
  UpdateCompanyPayload,
  CompanyBranchItem,
  CreateCompanyBranchPayload,
} from "../types/company.types";

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

export const companyService = {
  async getCompanies(filters?: Partial<CompanyFilterState>): Promise<{
    data: Company[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "All") {
        params.append("status", filters.status);
      }
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("limit", String(filters.pageSize));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/companies?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load companies."));
    }
    return await res.json();
  },

  async getCompanyById(id: string): Promise<{ data: Company }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load company details."));
    }
    return await res.json();
  },

  async createDraft(payload: CreateCompanyDraftPayload): Promise<{ data: Company; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/draft`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create company draft."));
    }
    return await res.json();
  },

  async createCompany(payload: UpdateCompanyPayload): Promise<{ data: Company; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create company."));
    }
    return await res.json();
  },

  async updateCompany(id: string, payload: UpdateCompanyPayload): Promise<{ data: Company; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update company profile."));
    }
    return await res.json();
  },

  async toggleStatus(id: string): Promise<{ data: Company; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/${id}/status`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to toggle company status."));
    }
    return await res.json();
  },

  async deleteCompany(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete company."));
    }
  },

  async createBranch(payload: CreateCompanyBranchPayload): Promise<{ data: CompanyBranchItem; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/${payload.companyId}/branches`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create company branch."));
    }
    return await res.json();
  },

  async getBranches(companyId?: string): Promise<{ data: CompanyBranchItem[] }> {
    const url = companyId
      ? `${API_BASE_URL}/companies/${companyId}/branches`
      : `${API_BASE_URL}/companies/branches`;
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load company branches."));
    }
    return await res.json();
  },

  async updateBranchStatus(
    branchId: string,
    status: "ACTIVE" | "INACTIVE"
  ): Promise<{ data: CompanyBranchItem; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/companies/branches/${branchId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update branch status."));
    }
    return await res.json();
  },
};

import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalariedEmployee,
  SalariedEmployeeFilterState,
  SalaryDetailsFormData,
  AbsentRecord,
} from "../types/salariedEmployee.types";

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

export const salariedEmployeeService = {
  async getSalariedEmployees(filters?: Partial<SalariedEmployeeFilterState>): Promise<{
    data: SalariedEmployee[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.employeeName) params.append("employeeName", filters.employeeName);
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.department && filters.department !== "all") {
        params.append("department", filters.department);
      }
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("limit", String(filters.pageSize));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/salaried-employees?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load salaried employees."));
    }
    return await res.json();
  },

  async getSalariedEmployeeById(
    id: string,
    financialYear: string = "2026-2027"
  ): Promise<SalariedEmployee> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/salaried-employees/${id}?financialYear=${encodeURIComponent(
        financialYear
      )}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load salaried employee details."));
    }
    const json = await res.json();
    return json.data;
  },

  async updateSalaryDetails(
    id: string,
    data: Partial<SalaryDetailsFormData>
  ): Promise<SalariedEmployee> {
    const res = await fetchWithAuth(`${API_BASE_URL}/salaried-employees/${id}/salary-details`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update salary details."));
    }
    const json = await res.json();
    return json.data;
  },

  async createAbsentRecord(
    id: string,
    data: Partial<AbsentRecord>
  ): Promise<AbsentRecord> {
    const res = await fetchWithAuth(`${API_BASE_URL}/salaried-employees/${id}/absent-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create absent record."));
    }
    const json = await res.json();
    return json.data;
  },

  async updateAbsentRecord(
    id: string,
    recordId: string,
    data: Partial<AbsentRecord>
  ): Promise<AbsentRecord> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/salaried-employees/${id}/absent-records/${recordId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update absent record."));
    }
    const json = await res.json();
    return json.data;
  },

  async deleteAbsentRecord(id: string, recordId: string): Promise<boolean> {
    const res = await fetchWithAuth(
      `${API_BASE_URL}/salaried-employees/${id}/absent-records/${recordId}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete absent record."));
    }
    return true;
  },

  async uploadAttendance(
    records: Array<{
      employeeId?: string;
      employeeName?: string;
      monthName?: string;
      monthIndex?: number;
      periodString?: string;
      absentHours?: number;
      overtimeHours?: number;
      financialYear?: string;
    }>
  ): Promise<{ importedCount: number; errors: string[] }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/salaried-employees/upload-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to upload attendance records."));
    }
    const json = await res.json();
    return json.data;
  },
};

